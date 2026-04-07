-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentResult" TEXT,
    "taxPrice" REAL NOT NULL DEFAULT 0.0,
    "shippingPrice" REAL NOT NULL DEFAULT 0.0,
    "totalPrice" REAL NOT NULL DEFAULT 0.0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "aiVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("aiVerified", "createdAt", "deliveredAt", "id", "isAccepted", "isDelivered", "isPaid", "paidAt", "paymentMethod", "paymentResult", "shippingAddress", "shippingPrice", "taxPrice", "totalPrice", "updatedAt", "userId") SELECT "aiVerified", "createdAt", "deliveredAt", "id", "isAccepted", "isDelivered", "isPaid", "paidAt", "paymentMethod", "paymentResult", "shippingAddress", "shippingPrice", "taxPrice", "totalPrice", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
