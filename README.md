# YaYa Eats — Dashboard Web (Next.js)

Panel de administracion web para restaurantes, riders y pedidos. Corre en el puerto `3000`.

---

## Requisitos

- Node.js 20+
- API corriendo en `localhost:3002` (para local)

---

## Desarrollo local

### 1. Variables de entorno

Convencion usada en este proyecto:

- `.env.local`: desarrollo local en cada maquina
- `.env`: QA/servidores compartidos cuando no existe `.env.production`
- `.env.production`: produccion futura

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

### Proceso de deploy (Docker Compose)

```bash
# 1. Subir cambios al repositorio
git add .
git commit -m "descripcion del cambio"
git push origin main

# 2. Conectarse al servidor por SSH
ssh root@85.31.62.55

# 3. En el servidor: actualizar y rebuild
cd /opt/yaya-eats
git pull origin main
docker compose down
docker compose up -d --build
```

### Variables de entorno en QA

En QA se usa `.env.qa` como archivo canónico.

Contenido esperado en QA:

```env
NEXT_PUBLIC_API_URL=https://yaya.work
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYXJyb3lvYW5nZWwiLCJhIjoiY21...
```

Para editar:

```bash
nano /opt/yaya-eats/delivery_ui_web/.env.qa
cd /opt/yaya-eats
git add delivery_ui_web/.env.qa
git commit -m "chore: update environment"
git push
git pull
docker compose down
docker compose up -d --build
```

---

## Troubleshooting

### Ver logs del Docker en QA

```bash
# Ver últimos logs
docker logs yaya-eats-web-1

# Ver logs en tiempo real
docker logs -f yaya-eats-web-1

# Ver últimas 100 líneas en tiempo real
docker logs -f --tail 100 yaya-eats-web-1

# Ver logs de otra fecha/hora
docker logs yaya-eats-web-1 | grep "2026-04-15"
```

### Problemas comunes

**Mixed Content error (HTTPS page + HTTP API)**
- Verifica que `NEXT_PUBLIC_API_URL` apunte a `https://yaya.work` (sin puerto)
- Nginx del sistema debe estar corriendo y proxeando correctamente

**Doble `/api` en la URL (ej: `/api/api/auth/login`)**
- Verifica que `NEXT_PUBLIC_API_URL` NO termina con `/api`
- Debe ser `https://yaya.work`, no `https://yaya.work/api`

---

## Estructura de puertos

| Entorno | URL |
|---------|-----|
| Local   | `http://localhost:3000` |
| QA      | `https://yaya.work` |
