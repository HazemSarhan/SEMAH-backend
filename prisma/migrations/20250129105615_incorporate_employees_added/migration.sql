-- CreateTable
CREATE TABLE "_EmployeeToIncorporationServices" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EmployeeToIncorporationServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EmployeeToIncorporationServices_B_index" ON "_EmployeeToIncorporationServices"("B");

-- AddForeignKey
ALTER TABLE "_EmployeeToIncorporationServices" ADD CONSTRAINT "_EmployeeToIncorporationServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmployeeToIncorporationServices" ADD CONSTRAINT "_EmployeeToIncorporationServices_B_fkey" FOREIGN KEY ("B") REFERENCES "IncorporationServices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
