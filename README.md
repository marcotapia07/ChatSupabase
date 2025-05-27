
# 🚀 SupaChat: Tu Chat en Tiempo Real con Ionic y Supabase 🚀

¡Bienvenido a **SupaChat**! Una aplicación de chat moderna y responsiva, construida con el poderoso framework **Ionic (Angular Standalone)** y potenciada por la flexibilidad y el rendimiento en tiempo real de **Supabase**. Sumérgete en la simplicidad de la comunicación instantánea con una base de datos robusta y segura detrás de escena.

---
## 🌟 Características Destacadas

* **Autenticación de Usuarios:** Acceso seguro mediante registro e inicio de sesión gestionado por Supabase Auth. ¡Tus conversaciones, solo para tus usuarios!
* **Perfiles de Usuario:** Cada usuario tiene un perfil asociado (`username`) para identificar claramente quién envía cada mensaje.
* **Chat en Tiempo Real:** Experimenta la magia de Supabase Realtime. Los mensajes aparecen instantáneamente para todos los participantes, sin necesidad de recargar la página.
* **Interfaz Intuitiva (Ionic):** Diseño limpio y experiencia de usuario fluida, optimizada para dispositivos móviles gracias a Ionic Framework.
* **Desplazamiento Automático:** La vista del chat se desplaza automáticamente al último mensaje para que no te pierdas nada.
* **Desarrollo Standalone:** Proyecto Angular configurado como `standalone`, lo que permite un desarrollo más modular y optimizado.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:**
    * **Ionic Framework:** Versión 7+ (Angular Standalone)
    * **Angular:** Framework para construir la interfaz de usuario.
    * **TypeScript:** Lenguaje de programación.
* **Backend & Base de Datos:**
    * **Supabase:** Base de datos de código abierto con PostgreSQL, autenticación, tiempo real y más, todo en uno.
        * **Supabase Auth:** Para la gestión de usuarios (registro, login, logout).
        * **Supabase Realtime:** Para la sincronización instantánea de mensajes.
        * **Row Level Security (RLS):** Para asegurar que solo los usuarios autenticados puedan interactuar con los mensajes.
        * **Triggers de Base de Datos:** Para automatizar la creación de perfiles de usuario al registrarse.

---

## 🧑‍💻 Integrantes del Equipo

¡Conoce a los cerebros detrás de SupaChat!

* **[Francis Aconda]** 
* **[Marco Tapia]** 

---

## 📸 Capturas de Pantalla

¡Échale un vistazo a SupaChat en acción!

| Pantalla de Login | Pantalla de Chat |
| :---------------: | :--------------: |
|   ![Login Screen] (![image](https://github.com/user-attachments/assets/d8bb029b-0072-4d83-8750-2e05edd953ad)
)    |    ![Chat Screen] (![image](https://github.com/user-attachments/assets/4f6242a7-9698-4b28-b26b-241f12e4a07c)
)   |
*Añade aquí más capturas si lo deseas, por ejemplo: registro de usuario, mensaje enviado, RLS en acción (si se pudiera visualizar), etc.*

---

## 🚀 Cómo Empezar (Instalación y Configuración)

Sigue estos pasos para poner en marcha SupaChat en tu entorno local.

### 1. Configuración de Supabase

1.  **Crea un Nuevo Proyecto Supabase:**
    * Ve a [Supabase.com](https://supabase.com/) y crea un nuevo proyecto.
    * Guarda tu **URL del proyecto** y tu **`anon public` key** (las encontrarás en `Project Settings > API`). Las necesitarás para tu aplicación Ionic.

2.  **Configura tus Tablas:**
    Asegúrate de que tus tablas `profiles` y `messages` existan con el siguiente esquema. Puedes copiarlas directamente en el **SQL Editor** de Supabase.

    ```sql
    -- Tabla para los perfiles de usuario
    create table public.profiles (
      id uuid not null,
      username text not null,
      constraint profiles_pkey primary key (id),
      constraint profiles_username_key unique (username),
      constraint profiles_id_fkey foreign key (id) references auth.users (id) -- Vincula con la tabla de usuarios de Supabase Auth
    );

    -- Tabla para los mensajes del chat
    create table public.messages (
      id uuid not null default extensions.uuid_generate_v4(),
      user_id uuid not null, -- Clave foránea al ID del perfil
      content text not null,
      created_at timestamp with time zone null default now(),
      constraint messages_pkey primary key (id),
      constraint messages_user_id_fkey foreign key (user_id) references profiles (id) -- Vincula con la tabla de perfiles
    );
    ```

3.  **Habilita Row Level Security (RLS):**
    * En Supabase, ve a `Authentication` > `Policies`.
    * **Para la tabla `profiles`:**
        * Habilita RLS.
        * Crea una política `SELECT`: `(auth.uid() = id) OR (true)` (permite a los usuarios leer su propio perfil y otros para mostrar nombres en el chat).
        * Crea una política `UPDATE`: `(auth.uid() = id)` (permite a los usuarios actualizar solo su propio perfil).
    * **Para la tabla `messages`:**
        * Habilita RLS.
        * Crea una política `INSERT`: `auth.uid() is not null` (solo usuarios autenticados pueden enviar mensajes).
        * Crea una política `SELECT`: `auth.uid() is not null` (solo usuarios autenticados pueden leer mensajes).

4.  **Configura el Trigger para Perfiles Automáticos:**
    Este trigger asegura que cada vez que un usuario se registra con Supabase Auth, se crea automáticamente una entrada en tu tabla `profiles`.

    * Ve a `Database` > `Extensions` y asegúrate de que `uuid-ossp` esté habilitada.
    * En `Database` > `SQL Editor`, ejecuta el siguiente código:

        ```sql
        -- Función para crear un perfil cuando un nuevo usuario se registra
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, username)
          VALUES (NEW.id, NEW.email); -- Usa el email como username inicial
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger para ejecutar la función después de cada inserción en auth.users
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        ```

### 2. Configuración del Proyecto Ionic

1.  **Clona el Repositorio (o crea el proyecto si aún no lo tienes):**
    ```bash
    git clone [URL_DE_TU_REPOSITORIO]
    cd supa-chat
    ```
    Si no tienes un repo, puedes inicializar un proyecto Ionic `standalone`:
    ```bash
    ionic start supa-chat blank --type=angular --standalone
    cd supa-chat
    ```

2.  **Instala las Dependencias:**
    ```bash
    npm install
    npm install @supabase/supabase-js
    ```

3.  **Configura las Variables de Entorno:**
    * Abre `src/environments/environment.ts` y `src/environments/environment.prod.ts`.
    * Reemplaza los placeholders con tus credenciales de Supabase:

        ```typescript
        // src/environments/environment.ts
        export const environment = {
          production: false,
          supabaseUrl: 'TU_URL_DE_SUPABASE_AQUI',
          supabaseKey: 'TU_ANON_KEY_DE_SUPABASE_AQUI'
        };
        ```
        Haz lo mismo para `environment.prod.ts`.

4.  **Asegúrate de que tus archivos `.ts` coincidan con los proporcionados:**
    * `src/app/home/home.page.ts` (el código del chat)
    * `src/app/auth/auth.page.ts` (el componente de login/registro)
    * `src/app/services/supabase.service.ts` (el servicio de Supabase)
    * `src/app/app.routes.ts` (las rutas con el guardia de autenticación)

    Si los archivos no existen o necesitas actualizarlos, puedes copiarlos de las respuestas previas.

### 3. Ejecuta la Aplicación

```bash
ionic serve
```
¡Abre tu navegador (normalmente en `http://localhost:8100/`) y comienza a chatear!

---


