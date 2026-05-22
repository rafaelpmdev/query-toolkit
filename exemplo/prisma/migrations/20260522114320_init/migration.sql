-- CreateTable
CREATE TABLE "coffee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "roast" TEXT NOT NULL,
    "flavor" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coffee_pkey" PRIMARY KEY ("id")
);
