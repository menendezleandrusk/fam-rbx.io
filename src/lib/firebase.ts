import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DiplomaRecord } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the exact databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot as mandated by the Firebase Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[FAM Firebase] Conexión establecida exitosamente con Firestore.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[FAM Firebase] Error de conexión: El cliente está desconectado.');
    } else {
      console.log('[FAM Firebase] Test connection ping finalizado.');
    }
    return false;
  }
}

// Automatically trigger test connection
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==============================================================================
// SERVICIOS FIRESTORE PARA DIPLOMAS Y AUDITORÍA MILITAR FAM
// ==============================================================================

const DIPLOMAS_COLLECTION = 'diplomas';
const VERIFY_LOGS_COLLECTION = 'verification_logs';

/**
 * Escucha en tiempo real todos los diplomas registrados en Firestore
 */
export function subscribeDiplomas(
  onUpdate: (diplomas: DiplomaRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, DIPLOMAS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records: DiplomaRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as DiplomaRecord);
      });
      // Sort newest first
      records.sort((a, b) => (b.createdAt || b.issueDate).localeCompare(a.createdAt || a.issueDate));
      onUpdate(records);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, DIPLOMAS_COLLECTION);
    }
  );
}

/**
 * Obtiene la lista completa de diplomas desde Firestore
 */
export async function getDiplomasFromFirestore(): Promise<DiplomaRecord[]> {
  try {
    const colRef = collection(db, DIPLOMAS_COLLECTION);
    const snap = await getDocs(colRef);
    const records: DiplomaRecord[] = [];
    snap.forEach((docSnap) => {
      records.push(docSnap.data() as DiplomaRecord);
    });
    records.sort((a, b) => (b.createdAt || b.issueDate).localeCompare(a.createdAt || a.issueDate));
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DIPLOMAS_COLLECTION);
  }
}

/**
 * Inicializa diplomas base en Firestore si la colección está vacía
 */
export async function seedInitialDiplomas(initialList: DiplomaRecord[]): Promise<void> {
  try {
    const existing = await getDiplomasFromFirestore();
    if (existing.length === 0) {
      for (const item of initialList) {
        await saveDiplomaToFirestore(item);
      }
      console.log(`[FAM Firebase] Colección 'diplomas' inicializada con ${initialList.length} registros oficiales.`);
    }
  } catch (e) {
    console.warn('[FAM Firebase] No se pudo auto-sembrar diplomas:', e);
  }
}

/**
 * Guarda un nuevo diploma militar en Firestore
 */
export async function saveDiplomaToFirestore(diploma: DiplomaRecord): Promise<void> {
  const path = `${DIPLOMAS_COLLECTION}/${diploma.id}`;
  try {
    const docRef = doc(db, DIPLOMAS_COLLECTION, diploma.id);
    await setDoc(docRef, {
      ...diploma,
      createdAt: diploma.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Verifica un diploma por su código o folio y registra la auditoría en Firestore
 */
export async function verifyDiplomaInFirestore(
  code: string,
  verifierUser = 'Oficial / Cadete FAM'
): Promise<{ found: boolean; diploma?: DiplomaRecord }> {
  const cleanCode = code.trim().toUpperCase();
  const path = `${DIPLOMAS_COLLECTION}/${cleanCode}`;
  
  try {
    const docRef = doc(db, DIPLOMAS_COLLECTION, cleanCode);
    const docSnap = await getDoc(docRef);

    let found = false;
    let diploma: DiplomaRecord | undefined = undefined;

    if (docSnap.exists()) {
      found = true;
      diploma = docSnap.data() as DiplomaRecord;
    } else {
      // Fallback: search across diplomas list if code was lowercase or partial
      const allDocs = await getDiplomasFromFirestore();
      diploma = allDocs.find((d) => d.id.toUpperCase() === cleanCode);
      found = Boolean(diploma);
    }

    // Registrar bitácora de verificación en Firestore
    try {
      const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const logRef = doc(db, VERIFY_LOGS_COLLECTION, logId);
      await setDoc(logRef, {
        id: logId,
        diplomaId: diploma?.id || cleanCode,
        code: cleanCode,
        verifiedAt: new Date().toISOString(),
        verifierUser,
        isValid: found && diploma?.status === 'VALID',
        ipHash: 'fam-client-auth',
      });
    } catch (logErr) {
      console.warn('[FAM Firebase] No se pudo guardar log de auditoría:', logErr);
    }

    return { found, diploma };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Actualiza el estado de un diploma (VALID / REVOKED)
 */
export async function updateDiplomaStatus(diplomaId: string, status: 'VALID' | 'REVOKED'): Promise<void> {
  const path = `${DIPLOMAS_COLLECTION}/${diplomaId}`;
  try {
    const docRef = doc(db, DIPLOMAS_COLLECTION, diplomaId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
