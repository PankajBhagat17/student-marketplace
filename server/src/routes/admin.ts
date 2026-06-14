// server/src/routes/admin.ts
import { Router } from 'express';
import ExcelJS from 'exceljs';
import User from '../models/User';
import Listing from '../models/Listing';

const router = Router();

router.get('/export-data', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Users
    const userSheet = workbook.addWorksheet('Users');
    userSheet.columns = [
      { header: 'Email', key: 'email', width: 30 },
      { header: 'College Domain', key: 'college_domain', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    const users = await User.findAll();
    users.forEach(u => userSheet.addRow(u.toJSON()));

    // Sheet 2: All Listings (Including Status)
    const listSheet = workbook.addWorksheet('Marketplace Items');
    listSheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Seller', key: 'seller_email', width: 30 },
      { header: 'Status', key: 'status', width: 10 }
    ];
    const listings = await Listing.findAll();
    listings.forEach(l => listSheet.addRow(l.toJSON()));

    // Setup response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Marketplace_Data.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

export default router;