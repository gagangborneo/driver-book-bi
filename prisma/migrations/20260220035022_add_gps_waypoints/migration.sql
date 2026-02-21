-- CreateTable
CREATE TABLE "GPSWaypoint" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSWaypoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GPSWaypoint_bookingId_idx" ON "GPSWaypoint"("bookingId");

-- CreateIndex
CREATE INDEX "GPSWaypoint_timestamp_idx" ON "GPSWaypoint"("timestamp");

-- AddForeignKey
ALTER TABLE "GPSWaypoint" ADD CONSTRAINT "GPSWaypoint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
