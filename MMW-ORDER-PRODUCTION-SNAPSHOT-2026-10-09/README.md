# MMW-ORDER production source snapshot — 2026-10-09

Point-in-time source snapshot of the production MMW-ORDER application.

- Source repository: https://github.com/itimchenko00-hash/MMW-ORDER
- Source branch: main
- Source production commit: c4a2941852c501fcf627e381c34fb4f7eecfae46
- Production URL: https://mmw-order.onrender.com
- Database: Neon project mmw-order-production (external; database contents are NOT included here)

This snapshot excludes environment secrets, DATABASE_URL, email/Telegram tokens, and production order records.
Do not deploy this snapshot as a second live order service or point it at the production database without a separate controlled setup.
