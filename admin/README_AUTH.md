# Admin login (PHP)

Tahle složka obsahuje jednoduchý login systém postavený na:
- PHP sessions
- MySQL přes PDO (`admin/db.php`)
- `password_hash()` / `password_verify()`
- CSRF token pro formuláře

## Stránky
- `admin/register.php` – vytvoření **prvního** admin účtu (a tabulky `admin_users`)
- `admin/login.php` – přihlášení
- `admin/logout.php` – odhlášení
- `admin/index.php` – chráněný dashboard (ukázka)

## DB tabulka
Registrace automaticky vytvoří tabulku:

```sql
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Bezpečnost registrace
Ve výchozím stavu je registrace povolená jen pokud v tabulce zatím není žádný admin.

Pokud chcete povolit registraci dalšího admina přes tajný klíč v URL:
1) Definujte konstantu `ADMIN_REGISTER_KEY` (např. v `admin/auth/bootstrap.php`).
2) Otevřete `register.php?key=VAS_KLIC`.

## Poznámka
`admin/db.php` obsahuje credentials v plain textu. Doporučení: přesun do configu mimo repo.