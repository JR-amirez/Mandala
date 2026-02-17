# STEAM-G Mandala

Juego educativo para el desarrollo de habilidades matematicas mediante mandalas interactivos. Construido con **React 19**, **Ionic 8**, **Capacitor 8** y **Vite 5**.

---

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- **Ionic CLI**: `npm install -g @ionic/cli`
- (Opcional) **Android Studio** si se desea compilar el APK final

---

## Instalacion

```bash
npm install
```

---

## Desarrollo local

```bash
npm run dev
```

Abre el servidor de desarrollo de Vite en `http://localhost:5173`.

---

## Build: generar `android-base.zip`

El comando principal de build genera un archivo ZIP listo para importar en Android Studio:

```bash
npm run build
```

### Pipeline completo

El script `build` ejecuta los siguientes pasos en orden:

| # | Script                  | Descripcion                                                                                           |
|---|-------------------------|-------------------------------------------------------------------------------------------------------|
| 1 | `build:web`             | Compila la aplicacion React con Vite (salida en `dist/`).                                            |
| 2 | `build:android`         | Crea la carpeta `android/` con Capacitor si no existe.                                                |
| 3 | `build:android:sync`    | Copia el contenido de `dist/` a `android/app/src/main/assets/public/`.                                |
| 4 | `patch:capacitor`       | Parchea los archivos Gradle para reemplazar dependencias locales de Capacitor por dependencias Maven. |
| 5 | `clean:assets`          | Elimina archivos innecesarios para reducir el tamano del ZIP (ver detalle abajo).                     |
| 6 | `zip:android`           | Comprime la carpeta `android/` en `android-base.zip`.                                                 |

### Archivos eliminados en `clean:assets`

Para optimizar el tamano del ZIP resultante, el paso `clean:assets` elimina los siguientes archivos y carpetas que **no son necesarios** para compilar el proyecto en Android Studio:

| Archivo / Carpeta                                          | Razon de eliminacion                              |
|------------------------------------------------------------|---------------------------------------------------|
| `android/.gradle/`                                         | Cache de Gradle (se regenera automaticamente)     |
| `android/.idea/`                                           | Metadata de IDE (se regenera al abrir el proyecto)|
| `android/app/build/`                                       | Artefactos de compilacion previos                 |
| `android/build/`                                           | Artefactos de compilacion del proyecto raiz        |
| `android/capacitor-cordova-android-plugins/build/`         | Artefactos de compilacion de plugins              |
| `android/local.properties`                                 | Ruta local del SDK (especifica de cada maquina)   |
| `android/app/src/androidTest/`                             | Tests de instrumentacion (no requeridos)          |
| `android/app/src/test/`                                    | Tests unitarios Android (no requeridos)           |
| `android/.gitignore`                                       | Archivo git innecesario para el ZIP               |
| `config/mandala-config.json`                               | Archivo de configuracion local (ver seccion abajo)|
| `config/mandala-config-example.json`                       | Ejemplo de configuracion (no requerido en prod)   |

> El ZIP final (`android-base.zip`) queda listo para ser abierto directamente en Android Studio, donde Gradle regenerara automaticamente los archivos eliminados.

### Ejecutar pasos individuales

Cada paso puede ejecutarse por separado si es necesario:

```bash
npm run build:web            # Solo compilar la app web
npm run build:android        # Solo crear la carpeta android/
npm run build:android:sync   # Solo sincronizar dist/ -> android/
npm run patch:capacitor      # Solo parchear Gradle
npm run clean:assets         # Solo limpiar archivos innecesarios
npm run zip:android          # Solo generar el ZIP
```

---

## Archivo de configuracion: `mandala-config.json`

La aplicacion soporta un archivo de configuracion opcional que permite personalizar el comportamiento del juego **sin modificar el codigo fuente**.

### Ubicacion

- **Desarrollo**: `public/config/mandala-config.json`
- **Android (runtime)**: `android/app/src/main/assets/public/config/mandala-config.json`

> **Nota**: Este archivo se elimina durante el build (`clean:assets`). Si se desea incluir en el APK final, debe colocarse manualmente en la carpeta del proyecto Android antes de compilar, o agregarse despues de descomprimir `android-base.zip`.

### Comportamiento

- Si el archivo **existe**, la app lee la configuracion y aplica los valores definidos.
- Si el archivo **no existe** o hay un error al leerlo, la app usa los valores por defecto definidos en el codigo.
- Cada propiedad es **opcional**: solo se sobreescriben los valores que se incluyan en el archivo.

### Estructura completa

```json
{
  "nombreApp": "STEAM-G",
  "nivel": "basico",
  "version": "1.0",
  "fecha": "2025-12-02",
  "descripcion": "Juego para el desarrollo de habilidades matematicas",
  "plataformas": ["android"],
  "mandalasDisponibles": {
    "basico": ["arbol1", "flor", "mariposa", "sol"],
    "intermedio": ["alegria", "nube", "furia"],
    "avanzado": ["hexagonos", "masaico", "constelacion"]
  }
}
```

### Opciones disponibles

| Propiedad              | Tipo       | Descripcion                                                         | Ejemplo                |
|------------------------|------------|---------------------------------------------------------------------|------------------------|
| `nombreApp`            | `string`   | Nombre de la aplicacion mostrado en la interfaz.                    | `"STEAM-G"`            |
| `nivel`                | `string`   | Nivel de dificultad inicial al abrir la app.                        | `"basico"`             |
| `autor`                | `string`   | Nombre del autor mostrado en la pantalla de informacion.            | `"Valeria C. Z."`     |
| `version`              | `string`   | Version de la aplicacion mostrada en la interfaz.                   | `"1.0"`                |
| `fecha`                | `string`   | Fecha de publicacion en formato ISO (`YYYY-MM-DD`).                 | `"2025-12-02"`         |
| `descripcion`          | `string`   | Descripcion breve del juego.                                        | `"Juego educativo..."` |
| `plataformas`          | `string[]` | Lista de plataformas soportadas.                                    | `["android"]`          |
| `mandalasDisponibles`  | `object`   | Mandalas habilitados por nivel de dificultad (ver tabla de IDs).    | Ver abajo              |

### Valores de `nivel`

| Valor          | Alias aceptados          |
|----------------|--------------------------|
| `"basico"`     | `"basic"`                |
| `"intermedio"` | `"intermediate"`         |
| `"avanzado"`   | `"advanced"`             |

### IDs de mandalas disponibles

#### Basico (8 mandalas)

| ID        | Nombre     | Aliases                    |
|-----------|------------|----------------------------|
| `arbol1`  | Arbol      | `nat1`, `arbol`, `m1`     |
| `flor`    | Flor       | `nat2`, `flor1`, `m2`     |
| `mariposa`| Mariposa   | `nat3`, `mariposa1`, `m3` |
| `sol`     | Sol        | `nat4`, `m4`              |
| `hoja`    | Hoja       | `nat5`, `m5`              |
| `arbol2`  | Arbol 2    | `nat6`, `m6`              |
| `pez`     | Pez        | `nat7`, `m7`              |
| `buho`    | Buho       | `nat8`, `m8`              |

#### Intermedio (8 mandalas)

| ID         | Nombre    | Aliases                       |
|------------|-----------|-------------------------------|
| `alegria`  | Alegria   | `nat9`, `m9`                 |
| `nube`     | Tristeza  | `nat10`, `tristeza`, `m10`   |
| `furia`    | Furia     | `nat11`, `ira`, `m11`       |
| `miedo`    | Miedo     | `nat12`, `m12`               |
| `asco`     | Asco      | `nat13`, `m13`               |
| `sorpresa` | Sorpresa  | `nat14`, `m14`               |
| `peso`     | Culpa     | `nat15`, `culpa`, `m15`     |
| `rubor`    | Rubor     | `nat16`, `verguenza`, `m16` |

#### Avanzado (8 mandalas)

| ID             | Nombre        | Aliases                          |
|----------------|---------------|----------------------------------|
| `hexagonos`    | Hexagonos     | `nat17`, `geo1`, `m17`          |
| `masaico`      | Mosaico       | `nat18`, `mosaico`, `geo2`, `m18` |
| `constelacion` | Constelacion  | `nat19`, `geo3`, `m19`          |
| `galaxia`      | Galaxia       | `nat20`, `geo4`, `m20`          |
| `laberinto`    | Laberinto     | `nat21`, `geo5`, `m21`          |
| `corona`       | Corona        | `nat22`, `geo6`, `m22`          |
| `jardin`       | Jardin        | `nat23`, `geo7`, `m23`          |
| `octagonal`    | Octagonal     | `nat24`, `mandala-octagonal`, `geo8`, `m24` |

### Ejemplo: configuracion con solo 3 mandalas basicos

```json
{
  "nivel": "basico",
  "mandalasDisponibles": {
    "basico": ["flor", "sol", "buho"]
  }
}
```

En este caso, solo se muestran 3 mandalas en el nivel basico. Los niveles intermedio y avanzado conservan sus mandalas por defecto ya que no fueron especificados.

---

## Scripts adicionales

| Script           | Descripcion                                    |
|------------------|------------------------------------------------|
| `npm run dev`    | Servidor de desarrollo con hot reload          |
| `npm run preview`| Vista previa de la build de produccion         |
| `npm run lint`   | Ejecuta ESLint sobre el codigo fuente          |
| `npm test.unit`  | Ejecuta tests unitarios con Vitest             |
| `npm test.e2e`   | Ejecuta tests E2E con Cypress                  |

