// สร้างไฟล์ CSV ยอดขาย / การเงิน (ปุ่ม CSV ในหน้ายอดขายและหน้าการเงิน)
import { BILL_STATUS_LABEL, PAYMENT_METHODS } from '../config/constants'
import { dateTimeOf, mergeBillItems } from './format'
import { csvCell } from './security'

function download(filename, rows) {
  // BOM ขึ้นต้นไฟล์ → Excel เปิดภาษาไทยได้ถูกต้อง
  const csv = '﻿' + rows.join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadSalesCsv(bills, from, to) {
  const header = ['วันเวลา', 'โต๊ะ', 'รายการ', 'จำนวนรอบ', 'ยอด', 'สถานะ', 'วิธีชำระ']
  const lines = bills.map((b) =>
    [
      dateTimeOf(b.paid_at || b.updated_at),
      b.table_label,
      mergeBillItems(b.orders).map((i) => `${i.qty}x ${i.name}`).join(' | '),
      b.orders.length,
      b.total,
      BILL_STATUS_LABEL[b.status],
      PAYMENT_METHODS[b.payment_method] || '',
    ]
      .map(csvCell)
      .join(','),
  )
  download(`tokyo-house-sales-${from}-to-${to}.csv`, [header.join(','), ...lines])
}

// income = ยอดรวมบิลที่ชำระแล้วในช่วงเดียวกัน
export function downloadFinanceCsv({ expenses, categories, income, from, to }) {
  const catName = (id) => categories.find((c) => c.id === id)?.name || 'ไม่มีหมวด'
  const expense = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const header = ['วันที่', 'หมวด', 'รายละเอียด', 'จำนวนเงิน']
  const lines = expenses.map((e) => [e.spent_on, catName(e.category_id), e.note || '', e.amount].map(csvCell).join(','))
  // ตัวเลขสรุปคำนวณเอง (ไม่ใช่ข้อความจากผู้ใช้) จึงไม่ต้อง escape — ติดลบจะได้ยังเป็นตัวเลขใน Excel
  const summary = [
    '',
    `${csvCell('รายรับ (บิลที่รับชำระแล้ว)')},,,${income}`,
    `${csvCell('รายจ่าย')},,,${expense}`,
    `${csvCell('กำไรสุทธิ')},,,${income - expense}`,
  ]
  download(`tokyo-house-finance-${from}-to-${to}.csv`, [header.join(','), ...lines, ...summary])
}
