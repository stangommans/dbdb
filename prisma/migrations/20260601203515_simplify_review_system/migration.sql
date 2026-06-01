/*
  Warnings:

  - You are about to drop the column `murkiness` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `relativePrice` on the `Review` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barId" TEXT NOT NULL,
    "diveScore" INTEGER NOT NULL,
    "pricePerMl" REAL,
    "comment" TEXT,
    "photoUrl" TEXT,
    "amenities" TEXT,
    "vessel" TEXT,
    "vesselSize" TEXT,
    "vesselSizeMl" REAL,
    "purchasePrice" REAL,
    "purchaseCurrency" TEXT,
    "reviewerToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_barId_fkey" FOREIGN KEY ("barId") REFERENCES "Bar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("amenities", "barId", "comment", "createdAt", "diveScore", "id", "photoUrl", "pricePerMl", "purchaseCurrency", "purchasePrice", "reviewerToken", "updatedAt", "vessel", "vesselSize", "vesselSizeMl") SELECT "amenities", "barId", "comment", "createdAt", "diveScore", "id", "photoUrl", "pricePerMl", "purchaseCurrency", "purchasePrice", "reviewerToken", "updatedAt", "vessel", "vesselSize", "vesselSizeMl" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
