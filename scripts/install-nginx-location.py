#!/usr/bin/env python3
"""
Идемпотентно добавляет location /prmpt/ в server-блок freejam.online.
Запуск: sudo python3 /var/www/prmpt/scripts/install-nginx-location.py
"""
import re
import shutil
import sys
import datetime
from pathlib import Path

VHOST = Path('/etc/nginx/sites-available/freejam.online')
BLOCK = """
    # PRMPT — GameDev Prompt & Markdown Architect (SPA + REST API)
    location = /prmpt { return 301 /prmpt/; }

    location /prmpt/ {
        proxy_pass http://127.0.0.1:8030;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /prmpt;
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;

        gzip on;
        gzip_types text/html text/css application/javascript text/javascript application/json image/svg+xml;
        gzip_min_length 512;
    }

"""
ANCHOR = '    location / { try_files $uri $uri/ =404; }'

if not VHOST.exists():
    sys.exit(f'НЕ НАЙДЕН: {VHOST}')

src = VHOST.read_text(encoding='utf-8')

if 'location /prmpt/' in src:
    print('SKIP: блок location /prmpt/ уже присутствует')
    sys.exit(0)

if ANCHOR not in src:
    sys.exit(f'НЕ НАЙДЕН якорь для вставки: {ANCHOR!r}')

backup = VHOST.with_suffix('.online.bak-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
shutil.copy2(VHOST, backup)

src = src.replace(ANCHOR, BLOCK + ANCHOR, 1)
VHOST.write_text(src, encoding='utf-8')
print(f'OK: блок добавлен. Бэкап: {backup}')
