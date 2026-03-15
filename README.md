# YaYa Eats — Dashboard Web (Next.js)

Panel de administracion web para restaurantes, riders y pedidos. Corre en el puerto `3000`.

---

## Requisitos

- Node.js 20+
- API corriendo en `localhost:3002` (para local)

---

## Desarrollo local

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Valores clave para local (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYXJyb3lvYW5nZWwiLCJhIjoiY21...
```

### 2. Correr el servidor de desarrollo

```bash
cd delivery_ui_web
npm install
npm run dev
```

El dashboard estara en `http://localhost:3000`.

---

## Deploy a QA (yaya.work)

El servidor QA es `85.31.62.55`. El dashboard corre en `/opt/yaya-eats/delivery_ui_web/`.

### Proceso de deploy

```bash
# 1. Subir cambios al repositorio
git add .
git commit -m "descripcion del cambio"
git push origin main

# 2. Conectarse al servidor por SSH
ssh root@85.31.62.55

# 3. En el servidor: actualizar y rebuild
cd /opt/yaya-eats/delivery_ui_web
git pull origin main
npm install
npm run build

# 4. Reiniciar el proceso (si usa PM2)
pm2 restart delivery_ui_web

# o si usa docker:
cd /opt/yaya-eats
docker compose build delivery_ui_web
docker compose up -d delivery_ui_web
```

### Variables de entorno en QA

El archivo `.env.local` en el servidor tiene las URLs de produccion:

```env
NEXT_PUBLIC_API_URL=https://api.yaya.work
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYXJyb3lvYW5nZWwiLCJhIjoiY21...
```

Para editar:

```bash
nano /opt/yaya-eats/delivery_ui_web/.env.local
npm run build
pm2 restart delivery_ui_web
```

---

## Estructura de puertos

| Entorno | URL |
|---------|-----|
| Local   | `http://localhost:3000` |
| QA      | `https://yaya.work` |
