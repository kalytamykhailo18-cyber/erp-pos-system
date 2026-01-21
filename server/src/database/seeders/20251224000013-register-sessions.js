'use strict';
const { v4: uuidv4 } = require('uuid');

// Helper function to generate realistic bill breakdown for a given amount (Argentina 2024 bills)
const generateBillBreakdown = (totalAmount) => {
  // Petty cash in Argentina typically has this breakdown
  let remaining = totalAmount;

  const bills_20000 = Math.floor(remaining / 20000 * 0.20); // 20% in 20000s
  remaining -= bills_20000 * 20000;

  const bills_10000 = Math.floor(remaining / 10000 * 0.25); // 25% in 10000s
  remaining -= bills_10000 * 10000;

  const bills_2000 = Math.floor(remaining / 2000 * 0.15); // 15% in 2000s
  remaining -= bills_2000 * 2000;

  const bills_1000 = Math.floor(remaining / 1000 * 0.15); // 15% in 1000s
  remaining -= bills_1000 * 1000;

  const bills_500 = Math.floor(remaining / 500 * 0.10); // 10% in 500s
  remaining -= bills_500 * 500;

  const bills_200 = Math.floor(remaining / 200 * 0.08); // 8% in 200s
  remaining -= bills_200 * 200;

  const bills_100 = Math.floor(remaining / 100 * 0.05); // 5% in 100s
  remaining -= bills_100 * 100;

  const bills_50 = Math.floor(remaining / 50 * 0.02); // 2% in 50s
  remaining -= bills_50 * 50;

  const coins = parseFloat(remaining.toFixed(2)); // Rest in coins

  return {
    bills_20000,
    bills_10000,
    bills_2000,
    bills_1000,
    bills_500,
    bills_200,
    bills_100,
    bills_50,
    coins
  };
};

module.exports = {
  async up(queryInterface) {
    // Get all cash registers
    const [registers] = await queryInterface.sequelize.query(
      `SELECT cr.id, cr.register_number, cr.branch_id, b.code as branch_code
       FROM cash_registers cr
       JOIN branches b ON cr.branch_id = b.id;`
    );

    // Get all users
    const [users] = await queryInterface.sequelize.query(
      `SELECT u.id, u.email, u.first_name, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id;`
    );

    const owner = users.find(u => u.email === 'juan@petfood.com');
    const manager = users.find(u => u.email === 'maria@petfood.com');
    const carlos = users.find(u => u.email === 'carlos@petfood.com');
    const ana = users.find(u => u.email === 'ana@petfood.com');
    const luis = users.find(u => u.email === 'luis@petfood.com');
    const sofia = users.find(u => u.email === 'sofia@petfood.com');

    // Get registers by branch
    const br1Registers = registers.filter(r => r.branch_code === 'BR001');
    const br2Registers = registers.filter(r => r.branch_code === 'BR002');
    const br3Registers = registers.filter(r => r.branch_code === 'BR003');
    const br4Registers = registers.filter(r => r.branch_code === 'BR004');

    const sessions = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Session counter for unique session numbers
    let sessionCounter = 1;

    // ===== Branch 1 Sessions (La Tablada - 2:00 PM midday closing) =====

    // 3 days ago - MORNING shift (Carlos)
    const opening1 = generateBillBreakdown(100000.00); // Petty cash fund
    const closing1 = generateBillBreakdown(235500.00); // Fund + sales
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(threeDaysAgo),
      opened_by: carlos.id,
      opened_at: new Date(threeDaysAgo.setHours(8, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening1.bills_20000,
      opening_bills_10000: opening1.bills_10000,
      opening_bills_2000: opening1.bills_2000,
      opening_bills_1000: opening1.bills_1000,
      opening_bills_500: opening1.bills_500,
      opening_bills_200: opening1.bills_200,
      opening_bills_100: opening1.bills_100,
      opening_bills_50: opening1.bills_50,
      opening_coins: opening1.coins,
      opening_notes: 'Apertura turno mañana - Fondo de cambio OK',
      closed_by: carlos.id,
      closed_at: new Date(threeDaysAgo.setHours(14, 0, 0)),
      declared_cash: 235500.00,
      declared_card: 75000.00,
      declared_qr: 25000.00,
      declared_transfer: 15000.00,
      expected_cash: 235000.00,
      expected_card: 75000.00,
      expected_qr: 25000.00,
      expected_transfer: 15000.00,
      discrepancy_cash: 500.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 500.00,
      closing_bills_20000: closing1.bills_20000,
      closing_bills_10000: closing1.bills_10000,
      closing_bills_2000: closing1.bills_2000,
      closing_bills_1000: closing1.bills_1000,
      closing_bills_500: closing1.bills_500,
      closing_bills_200: closing1.bills_200,
      closing_bills_100: closing1.bills_100,
      closing_bills_50: closing1.bills_50,
      closing_coins: closing1.coins,
      status: 'CLOSED',
      closing_notes: 'Cierre sin novedades. Sobrante de $500 en efectivo.',
      created_at: new Date(threeDaysAgo),
      updated_at: new Date(threeDaysAgo)
    });

    // 3 days ago - AFTERNOON shift (Maria - Manager)
    const opening2 = generateBillBreakdown(100000.00);
    const closing2 = generateBillBreakdown(270000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'AFTERNOON',
      business_date: formatDate(threeDaysAgo),
      opened_by: manager.id,
      opened_at: new Date(threeDaysAgo.setHours(14, 30, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening2.bills_20000,
      opening_bills_10000: opening2.bills_10000,
      opening_bills_2000: opening2.bills_2000,
      opening_bills_1000: opening2.bills_1000,
      opening_bills_500: opening2.bills_500,
      opening_bills_200: opening2.bills_200,
      opening_bills_100: opening2.bills_100,
      opening_bills_50: opening2.bills_50,
      opening_coins: opening2.coins,
      opening_notes: 'Apertura turno tarde',
      closed_by: manager.id,
      closed_at: new Date(threeDaysAgo.setHours(20, 0, 0)),
      declared_cash: 270000.00,
      declared_card: 95000.00,
      declared_qr: 45000.00,
      declared_transfer: 30000.00,
      expected_cash: 270000.00,
      expected_card: 95000.00,
      expected_qr: 45000.00,
      expected_transfer: 30000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      closing_bills_20000: closing2.bills_20000,
      closing_bills_10000: closing2.bills_10000,
      closing_bills_2000: closing2.bills_2000,
      closing_bills_1000: closing2.bills_1000,
      closing_bills_500: closing2.bills_500,
      closing_bills_200: closing2.bills_200,
      closing_bills_100: closing2.bills_100,
      closing_bills_50: closing2.bills_50,
      closing_coins: closing2.coins,
      status: 'CLOSED',
      closing_notes: 'Cierre perfecto, sin discrepancias',
      created_at: new Date(threeDaysAgo),
      updated_at: new Date(threeDaysAgo)
    });

    // 2 days ago - FULL_DAY (Carlos)
    const opening3 = generateBillBreakdown(100000.00);
    const closing3 = generateBillBreakdown(550000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(twoDaysAgo),
      opened_by: carlos.id,
      opened_at: new Date(twoDaysAgo.setHours(8, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening3.bills_20000,
      opening_bills_10000: opening3.bills_10000,
      opening_bills_2000: opening3.bills_2000,
      opening_bills_1000: opening3.bills_1000,
      opening_bills_500: opening3.bills_500,
      opening_bills_200: opening3.bills_200,
      opening_bills_100: opening3.bills_100,
      opening_bills_50: opening3.bills_50,
      opening_coins: opening3.coins,
      opening_notes: 'Apertura día completo - Sábado',
      closed_by: carlos.id,
      closed_at: new Date(twoDaysAgo.setHours(20, 30, 0)),
      declared_cash: 548000.00,
      declared_card: 180000.00,
      declared_qr: 65000.00,
      declared_transfer: 45000.00,
      expected_cash: 550000.00,
      expected_card: 180000.00,
      expected_qr: 65000.00,
      expected_transfer: 45000.00,
      discrepancy_cash: -2000.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: -2000.00,
      closing_bills_20000: closing3.bills_20000,
      closing_bills_10000: closing3.bills_10000,
      closing_bills_2000: closing3.bills_2000,
      closing_bills_1000: closing3.bills_1000,
      closing_bills_500: closing3.bills_500,
      closing_bills_200: closing3.bills_200,
      closing_bills_100: closing3.bills_100,
      closing_bills_50: closing3.bills_50,
      closing_coins: closing3.coins,
      status: 'CLOSED',
      closing_notes: 'Faltante de $2000 en efectivo. Se revisará cámara.',
      created_at: new Date(twoDaysAgo),
      updated_at: new Date(twoDaysAgo)
    });

    // Yesterday - FULL_DAY (Carlos)
    const opening4 = generateBillBreakdown(100000.00);
    const closing4 = generateBillBreakdown(675000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: carlos.id,
      opened_at: new Date(yesterday.setHours(8, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening4.bills_20000,
      opening_bills_10000: opening4.bills_10000,
      opening_bills_2000: opening4.bills_2000,
      opening_bills_1000: opening4.bills_1000,
      opening_bills_500: opening4.bills_500,
      opening_bills_200: opening4.bills_200,
      opening_bills_100: opening4.bills_100,
      opening_bills_50: opening4.bills_50,
      opening_coins: opening4.coins,
      opening_notes: 'Domingo - Día de promociones especiales',
      closed_by: carlos.id,
      closed_at: new Date(yesterday.setHours(20, 0, 0)),
      declared_cash: 675000.00,
      declared_card: 210000.00,
      declared_qr: 85000.00,
      declared_transfer: 55000.00,
      expected_cash: 675000.00,
      expected_card: 210000.00,
      expected_qr: 85000.00,
      expected_transfer: 55000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      closing_bills_20000: closing4.bills_20000,
      closing_bills_10000: closing4.bills_10000,
      closing_bills_2000: closing4.bills_2000,
      closing_bills_1000: closing4.bills_1000,
      closing_bills_500: closing4.bills_500,
      closing_bills_200: closing4.bills_200,
      closing_bills_100: closing4.bills_100,
      closing_bills_50: closing4.bills_50,
      closing_coins: closing4.coins,
      status: 'CLOSED',
      closing_notes: 'Excelente jornada, ventas por encima del promedio',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN session (Carlos)
    const opening5 = generateBillBreakdown(100000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[0].id,
      branch_id: br1Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(today),
      opened_by: carlos.id,
      opened_at: new Date(today.setHours(8, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening5.bills_20000,
      opening_bills_10000: opening5.bills_10000,
      opening_bills_2000: opening5.bills_2000,
      opening_bills_1000: opening5.bills_1000,
      opening_bills_500: opening5.bills_500,
      opening_bills_200: opening5.bills_200,
      opening_bills_100: opening5.bills_100,
      opening_bills_50: opening5.bills_50,
      opening_coins: opening5.coins,
      opening_notes: 'Apertura normal lunes',
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      closing_bills_20000: null,
      closing_bills_10000: null,
      closing_bills_2000: null,
      closing_bills_1000: null,
      closing_bills_500: null,
      closing_bills_200: null,
      closing_bills_100: null,
      closing_bills_50: null,
      closing_coins: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 2 Sessions (San Justo - 2:30 PM midday closing) =====

    // Yesterday - FULL_DAY (Ana)
    const opening6 = generateBillBreakdown(100000.00);
    const closing6 = generateBillBreakdown(515000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br2Registers[0].id,
      branch_id: br2Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: ana.id,
      opened_at: new Date(yesterday.setHours(9, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening6.bills_20000,
      opening_bills_10000: opening6.bills_10000,
      opening_bills_2000: opening6.bills_2000,
      opening_bills_1000: opening6.bills_1000,
      opening_bills_500: opening6.bills_500,
      opening_bills_200: opening6.bills_200,
      opening_bills_100: opening6.bills_100,
      opening_bills_50: opening6.bills_50,
      opening_coins: opening6.coins,
      opening_notes: 'Apertura domingo sucursal San Justo',
      closed_by: ana.id,
      closed_at: new Date(yesterday.setHours(20, 0, 0)),
      declared_cash: 515000.00,
      declared_card: 145000.00,
      declared_qr: 55000.00,
      declared_transfer: 35000.00,
      expected_cash: 515000.00,
      expected_card: 145000.00,
      expected_qr: 55000.00,
      expected_transfer: 35000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      closing_bills_20000: closing6.bills_20000,
      closing_bills_10000: closing6.bills_10000,
      closing_bills_2000: closing6.bills_2000,
      closing_bills_1000: closing6.bills_1000,
      closing_bills_500: closing6.bills_500,
      closing_bills_200: closing6.bills_200,
      closing_bills_100: closing6.bills_100,
      closing_bills_50: closing6.bills_50,
      closing_coins: closing6.coins,
      status: 'CLOSED',
      closing_notes: 'Cierre perfecto',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN (Ana)
    const opening7 = generateBillBreakdown(100000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br2Registers[0].id,
      branch_id: br2Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(today),
      opened_by: ana.id,
      opened_at: new Date(today.setHours(9, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening7.bills_20000,
      opening_bills_10000: opening7.bills_10000,
      opening_bills_2000: opening7.bills_2000,
      opening_bills_1000: opening7.bills_1000,
      opening_bills_500: opening7.bills_500,
      opening_bills_200: opening7.bills_200,
      opening_bills_100: opening7.bills_100,
      opening_bills_50: opening7.bills_50,
      opening_coins: opening7.coins,
      opening_notes: 'Apertura lunes',
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      closing_bills_20000: null,
      closing_bills_10000: null,
      closing_bills_2000: null,
      closing_bills_1000: null,
      closing_bills_500: null,
      closing_bills_200: null,
      closing_bills_100: null,
      closing_bills_50: null,
      closing_coins: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 3 Sessions (Villa del Parque - 2:30 PM midday closing) =====

    // Yesterday - FULL_DAY (Luis)
    const opening8 = generateBillBreakdown(100000.00);
    const closing8 = generateBillBreakdown(461500.00);
    sessions.push({
      id: uuidv4(),
      register_id: br3Registers[0].id,
      branch_id: br3Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: luis.id,
      opened_at: new Date(yesterday.setHours(9, 30, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening8.bills_20000,
      opening_bills_10000: opening8.bills_10000,
      opening_bills_2000: opening8.bills_2000,
      opening_bills_1000: opening8.bills_1000,
      opening_bills_500: opening8.bills_500,
      opening_bills_200: opening8.bills_200,
      opening_bills_100: opening8.bills_100,
      opening_bills_50: opening8.bills_50,
      opening_coins: opening8.coins,
      opening_notes: 'Apertura domingo Villa del Parque',
      closed_by: luis.id,
      closed_at: new Date(yesterday.setHours(19, 30, 0)),
      declared_cash: 460000.00,
      declared_card: 98000.00,
      declared_qr: 42000.00,
      declared_transfer: 25000.00,
      expected_cash: 461500.00,
      expected_card: 98000.00,
      expected_qr: 42000.00,
      expected_transfer: 25000.00,
      discrepancy_cash: -1500.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: -1500.00,
      closing_bills_20000: closing8.bills_20000,
      closing_bills_10000: closing8.bills_10000,
      closing_bills_2000: closing8.bills_2000,
      closing_bills_1000: closing8.bills_1000,
      closing_bills_500: closing8.bills_500,
      closing_bills_200: closing8.bills_200,
      closing_bills_100: closing8.bills_100,
      closing_bills_50: closing8.bills_50,
      closing_coins: closing8.coins,
      status: 'CLOSED',
      closing_notes: 'Faltante menor en efectivo - Revisado',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN (Luis)
    const opening9 = generateBillBreakdown(100000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br3Registers[0].id,
      branch_id: br3Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(today),
      opened_by: luis.id,
      opened_at: new Date(today.setHours(9, 30, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening9.bills_20000,
      opening_bills_10000: opening9.bills_10000,
      opening_bills_2000: opening9.bills_2000,
      opening_bills_1000: opening9.bills_1000,
      opening_bills_500: opening9.bills_500,
      opening_bills_200: opening9.bills_200,
      opening_bills_100: opening9.bills_100,
      opening_bills_50: opening9.bills_50,
      opening_coins: opening9.coins,
      opening_notes: 'Apertura lunes',
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      closing_bills_20000: null,
      closing_bills_10000: null,
      closing_bills_2000: null,
      closing_bills_1000: null,
      closing_bills_500: null,
      closing_bills_200: null,
      closing_bills_100: null,
      closing_bills_50: null,
      closing_coins: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ===== Branch 4 Sessions (Sucursal Central - 2:30 PM midday closing) =====

    // Yesterday - FULL_DAY (Sofia)
    const opening10 = generateBillBreakdown(100000.00);
    const closing10 = generateBillBreakdown(395000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br4Registers[0].id,
      branch_id: br4Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'FULL_DAY',
      business_date: formatDate(yesterday),
      opened_by: sofia.id,
      opened_at: new Date(yesterday.setHours(10, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening10.bills_20000,
      opening_bills_10000: opening10.bills_10000,
      opening_bills_2000: opening10.bills_2000,
      opening_bills_1000: opening10.bills_1000,
      opening_bills_500: opening10.bills_500,
      opening_bills_200: opening10.bills_200,
      opening_bills_100: opening10.bills_100,
      opening_bills_50: opening10.bills_50,
      opening_coins: opening10.coins,
      opening_notes: 'Apertura domingo',
      closed_by: sofia.id,
      closed_at: new Date(yesterday.setHours(19, 0, 0)),
      declared_cash: 395000.00,
      declared_card: 75000.00,
      declared_qr: 35000.00,
      declared_transfer: 20000.00,
      expected_cash: 395000.00,
      expected_card: 75000.00,
      expected_qr: 35000.00,
      expected_transfer: 20000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      closing_bills_20000: closing10.bills_20000,
      closing_bills_10000: closing10.bills_10000,
      closing_bills_2000: closing10.bills_2000,
      closing_bills_1000: closing10.bills_1000,
      closing_bills_500: closing10.bills_500,
      closing_bills_200: closing10.bills_200,
      closing_bills_100: closing10.bills_100,
      closing_bills_50: closing10.bills_50,
      closing_coins: closing10.coins,
      status: 'CLOSED',
      closing_notes: 'Cierre sin novedades',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    // Today - OPEN (Sofia)
    const opening11 = generateBillBreakdown(100000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br4Registers[0].id,
      branch_id: br4Registers[0].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'MORNING',
      business_date: formatDate(today),
      opened_by: sofia.id,
      opened_at: new Date(today.setHours(10, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening11.bills_20000,
      opening_bills_10000: opening11.bills_10000,
      opening_bills_2000: opening11.bills_2000,
      opening_bills_1000: opening11.bills_1000,
      opening_bills_500: opening11.bills_500,
      opening_bills_200: opening11.bills_200,
      opening_bills_100: opening11.bills_100,
      opening_bills_50: opening11.bills_50,
      opening_coins: opening11.coins,
      opening_notes: 'Apertura lunes',
      closed_by: null,
      closed_at: null,
      declared_cash: null,
      declared_card: null,
      declared_qr: null,
      declared_transfer: null,
      expected_cash: null,
      expected_card: null,
      expected_qr: null,
      expected_transfer: null,
      discrepancy_cash: null,
      discrepancy_card: null,
      discrepancy_qr: null,
      discrepancy_transfer: null,
      total_discrepancy: null,
      closing_bills_20000: null,
      closing_bills_10000: null,
      closing_bills_2000: null,
      closing_bills_1000: null,
      closing_bills_500: null,
      closing_bills_200: null,
      closing_bills_100: null,
      closing_bills_50: null,
      closing_coins: null,
      status: 'OPEN',
      closing_notes: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Second register in Branch 1 - Yesterday CLOSED (Manager)
    const opening12 = generateBillBreakdown(100000.00);
    const closing12 = generateBillBreakdown(471000.00);
    sessions.push({
      id: uuidv4(),
      register_id: br1Registers[1].id,
      branch_id: br1Registers[1].branch_id,
      session_number: `S${String(sessionCounter++).padStart(6, '0')}`,
      shift_type: 'AFTERNOON',
      business_date: formatDate(yesterday),
      opened_by: manager.id,
      opened_at: new Date(yesterday.setHours(14, 0, 0)),
      opening_cash: 100000.00,
      opening_bills_20000: opening12.bills_20000,
      opening_bills_10000: opening12.bills_10000,
      opening_bills_2000: opening12.bills_2000,
      opening_bills_1000: opening12.bills_1000,
      opening_bills_500: opening12.bills_500,
      opening_bills_200: opening12.bills_200,
      opening_bills_100: opening12.bills_100,
      opening_bills_50: opening12.bills_50,
      opening_coins: opening12.coins,
      opening_notes: 'Caja 2 abierta por alto tráfico domingo',
      closed_by: manager.id,
      closed_at: new Date(yesterday.setHours(20, 0, 0)),
      declared_cash: 471000.00,
      declared_card: 120000.00,
      declared_qr: 48000.00,
      declared_transfer: 28000.00,
      expected_cash: 471000.00,
      expected_card: 120000.00,
      expected_qr: 48000.00,
      expected_transfer: 28000.00,
      discrepancy_cash: 0.00,
      discrepancy_card: 0.00,
      discrepancy_qr: 0.00,
      discrepancy_transfer: 0.00,
      total_discrepancy: 0.00,
      closing_bills_20000: closing12.bills_20000,
      closing_bills_10000: closing12.bills_10000,
      closing_bills_2000: closing12.bills_2000,
      closing_bills_1000: closing12.bills_1000,
      closing_bills_500: closing12.bills_500,
      closing_bills_200: closing12.bills_200,
      closing_bills_100: closing12.bills_100,
      closing_bills_50: closing12.bills_50,
      closing_coins: closing12.coins,
      status: 'CLOSED',
      closing_notes: 'Segunda caja cerrada correctamente',
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday)
    });

    await queryInterface.bulkInsert('register_sessions', sessions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('register_sessions', null, {});
  }
};
