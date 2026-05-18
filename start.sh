#!/bin/sh

# Ensure persistent mount directories are initialized on the VPS host
mkdir -p /data/uploads

# Bootstrapping the SQLite database onto the persistent host volume if absent
if [ ! -f /data/dev.db ]; then
  echo "Bootstrapping SQLite database onto persistent VPS volume..."
  cp /app/prisma/dev.db /data/dev.db
else
  echo "Persistent SQLite database verified on volume mount."
fi

# Apply correct file permissions for SQLite read/writes
chmod 666 /data/dev.db

# Dynamic monolithic symlink mapping: links public/uploads directly to persistent host volume uploads
echo "Configuring persistent uploads directory symbolic links..."
rm -rf /app/public/uploads
ln -s /data/uploads /app/public/uploads

# Boot Next.js standalone server
echo "Igniting Next.js Standalone server..."
node server.js
