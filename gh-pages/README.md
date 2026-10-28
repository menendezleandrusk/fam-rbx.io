# ✈️ Fuerza Aérea Mexicana (FAM) — Portal Web y Bot de Discord (Roblox Ro-Army)

Sistema estático oficial para la Fuerza Aérea Mexicana en Roblox, optimizado para desplegarse de manera 100% gratuita y sin costo en **GitHub Pages**.

---

## 📁 Estructura del Repositorio Estático

```text
├── index.html              # Portal principal con consulta de diplomas y panel de instructores
├── css/
│   └── fam-styles.css      # Sistema de diseño militar FAM (verde olivo, oro y noche)
├── js/
│   └── app.js              # Lógica cliente, persistencia LocalStorage y generador OAuth2
├── terms/
│   └── index.html          # Términos de Servicio oficiales para Discord Developer Portal
├── privacy/
│   └── index.html          # Política de Privacidad oficial para Discord Developer Portal
└── README.md               # Guía completa de despliegue y configuración
```

---

## 🚀 Guía de Despliegue Paso a Paso en GitHub Pages

### Paso 1: Crear el Repositorio en GitHub
1. Inicia sesión en [GitHub](https://github.com).
2. Haz clic en **New Repository** (Nuevo Repositorio).
3. Asigna un nombre al repositorio, por ejemplo: `fam-diplomas` o `fam-bot`.
4. Asegúrate de marcarlo como **Public** (Público).
5. No marques agregar README si vas a subir estos archivos directamente.
6. Haz clic en **Create repository**.

### Paso 2: Subir los Archivos al Repositorio
Puedes subir los archivos mediante la interfaz web de GitHub o con la consola de Git:

#### Opción A: Desde el Navegador Web (Más Sencillo)
1. En la página de tu repositorio vacío, haz clic en **"uploading an existing file"** (subir un archivo existente).
2. Arrastra los archivos y carpetas (`index.html`, carpeta `css`, carpeta `js`, carpeta `terms`, carpeta `privacy` y `README.md`).
3. Escribe un mensaje de confirmación (ej: `Initial commit - FAM GitHub Pages`).
4. Haz clic en **Commit changes**.

#### Opción B: Mediante Git en tu Computadora
```bash
git init
git add .
git commit -m "feat: despliegue inicial fam ro-army para github pages"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages en los Ajustes del Repositorio
1. En tu repositorio de GitHub, entra en la pestaña **Settings** (Ajustes) en la barra superior.
2. En la barra lateral izquierda, busca y selecciona **Pages** (dentro de la sección *Code and automation*).
3. En la sección **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Elige `main` (o `master`).
   - **Folder:** Elige `/ (root)`.
4. Haz clic en **Save** (Guardar).
5. Espera unos 60 segundos y refresca la página. GitHub te mostrará una caja verde indicando:  
   👉 **`Your site is live at https://TU-USUARIO.github.io/TU-REPOSITORIO/`**

---

## ⚙️ Configuración en el Discord Developer Portal

Una vez activo tu enlace de GitHub Pages, configúralo en tu aplicación de Discord para que los botones de autenticación y las páginas legales funcionen sin errores:

1. Ve a **[Discord Developer Portal](https://discord.com/developers/applications)** y entra en tu Bot (`1539391208411889676`).
2. En **General Information**:
   - **TERMS OF SERVICE URL:**  
     `https://TU-USUARIO.github.io/TU-REPOSITORIO/terms/`
   - **PRIVACY POLICY URL:**  
     `https://TU-USUARIO.github.io/TU-REPOSITORIO/privacy/`
   - Haz clic en **Save Changes**.
3. En la pestaña **OAuth2 ➡️ General**:
   - En la sección **Redirects**, haz clic en **Add Redirect**.
   - Pega tu URL de GitHub Pages exacta:  
     `https://TU-USUARIO.github.io/TU-REPOSITORIO/`
   - Haz clic en **Save Changes**.

---

## 🛡️ Características del Sistema

- **Páginas Legales Estáticas:** `/terms/` y `/privacy/` están estructuradas como carpetas independientes con `index.html` interno para resolver URLs limpias en cualquier hosting estático.
- **Persistencia sin Servidor:** Utiliza `localStorage` para almacenar nuevos certificados expedidos por instructores en el navegador.
- **Estética Militar FAM:** Insignias, paleta verde olivo institucional, ribetes dorados y certificados criptográficos interactivos.
- **Deslinde Legal Claro:** Contiene el aviso de roleplay militar privado dentro de Roblox, cumpliendo con las políticas de Discord y Roblox.
