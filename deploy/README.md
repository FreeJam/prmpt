# PRMPT — развертывание

## Что развернуто

| Параметр | Значение |
|---|---|
| Внешний адрес | **https://freejam.online/prmpt/** |
| Локальный адрес (на VPS) | `http://127.0.0.1:8030/` и `http://127.0.0.1:8030/prmpt/` |
| Порт приложения | **8030** (только loopback) |
| systemd unit | `prmpt-api.service` (User=www-data, включён в автозапуск) |
| Nginx | `location /prmpt/` в `/etc/nginx/sites-available/freejam.online` |
| Данные | `/var/www/prmpt/data/presets.json` |
| Каталог | `/var/www/prmpt` (владелец `www-data:www-data`) |
| Runtime | `/usr/bin/node` v24 (системный, не зависит от Hermes) |

Схема: `браузер → Nginx :443 → proxy_pass 127.0.0.1:8030 → Express (API + SPA из web/dist)`.

## Установка с нуля

```bash
cd /var/www/prmpt
npm install
npm --prefix web install
npm run build                     # web/dist

mkdir -p data && printf '{\n  "version": 1,\n  "presets": []\n}\n' > data/presets.json
chown -R www-data:www-data /var/www/prmpt

cp deploy/prmpt-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now prmpt-api

python3 scripts/install-nginx-location.py     # идемпотентно вставит location /prmpt/
nginx -t && systemctl reload nginx
```

## Проверка

```bash
systemctl status prmpt-api --no-pager
journalctl -u prmpt-api -n 30 --no-pager
curl -s http://127.0.0.1:8030/api/health
curl -s https://freejam.online/prmpt/api/health
node scripts/test-api.mjs https://freejam.online/prmpt
```

## Обновление кода

```bash
cd /var/www/prmpt
git pull                      # или правка файлов вручную
npm --prefix web install      # если менялся web/package.json
npm run build                 # обязательно после правок shared/ или web/
systemctl restart prmpt-api
```

Правки только в `server/` требуют `restart`; правки в `web/` или `shared/` — ещё и `npm run build`,
потому что `shared/` компилируется внутрь бандла фронтенда.

## Резервное копирование

Единственное изменяемое состояние — пресеты:

```bash
cp /var/www/prmpt/data/presets.json /root/backups/prmpt-presets-$(date +%F).json
```

## Nginx: почему без rewrite

`proxy_pass http://127.0.0.1:8030;` указывается **без завершающего слэша**, поэтому URI передаётся
целиком (`/prmpt/api/health` → `/prmpt/api/health`). Сервер приложения сам обслуживает и `/api`, и
`/prmpt/api`, а статику — по обоим префиксам. Это исключает рассинхрон с `base=/prmpt/` в сборке Vite
и не требует ни `rewrite`, ни `sub_filter`.

## Альтернатива: Docker

```bash
docker compose up -d --build      # слушает 127.0.0.1:8030, данные в volume prmpt-data
```

В контейнере `HOST=0.0.0.0` и используется `node:22-alpine`; наружу порт по-прежнему отдаёт Nginx.

## Диагностика

| Симптом | Причина и решение |
|---|---|
| Плашка «оффлайн» в UI | Не запущен `prmpt-api`: `systemctl restart prmpt-api` |
| 502 от Nginx | Порт 8030 не слушается: `ss -tlnp \| grep 8030` |
| Пустая страница, 404 на ассетах | Не выполнен `npm run build` (нет `web/dist`) |
| Не сохраняются пресеты | Права на `data/`: `chown -R www-data:www-data /var/www/prmpt/data` |
| ZIP не скачивается | Ошибка в журнале: `journalctl -u prmpt-api -n 50` |
