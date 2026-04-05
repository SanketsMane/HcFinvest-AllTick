import assert from 'node:assert/strict'

import ibEngine from '../services/ibEngineNew.js'
import IBPlan from '../models/IBPlanNew.js'
import IBLevel from '../models/IBLevel.js'
import IBCommission from '../models/IBCommissionNew.js'
import IBWallet from '../models/IBWallet.js'

const originals = {
  planFindById: IBPlan.findById,
  levelFindById: IBLevel.findById,
  levelFindOne: IBLevel.findOne,
  commissionFindOne: IBCommission.findOne,
  commissionCreate: IBCommission.create,
  walletGetOrCreate: IBWallet.getOrCreateWallet,
  getIBChain: ibEngine.getIBChain,
  getContractSize: ibEngine.getContractSize,
  resolveCommissionConfig: ibEngine.resolveCommissionConfig,
}

const restore = () => {
  IBPlan.findById = originals.planFindById
  IBLevel.findById = originals.levelFindById
  IBLevel.findOne = originals.levelFindOne
  IBCommission.findOne = originals.commissionFindOne
  IBCommission.create = originals.commissionCreate
  IBWallet.getOrCreateWallet = originals.walletGetOrCreate
  ibEngine.getIBChain = originals.getIBChain
  ibEngine.getContractSize = originals.getContractSize
  ibEngine.resolveCommissionConfig = originals.resolveCommissionConfig
}

const tests = []
const test = (name, fn) => tests.push({ name, fn })

const run = async () => {
  let pass = 0
  let fail = 0

  for (const t of tests) {
    try {
      await t.fn()
      console.log(`PASS: ${t.name}`)
      pass += 1
    } catch (err) {
      console.error(`FAIL: ${t.name}`)
      console.error(err?.stack || err?.message || err)
      fail += 1
    } finally {
      restore()
    }
  }

  console.log('\n==== IB Scenario Test Summary ====')
  console.log(`Passed: ${pass}`)
  console.log(`Failed: ${fail}`)

  if (fail > 0) process.exit(1)
}

// Core helpers
test('normalizeCommissionType handles PERCENTAGE alias', async () => {
  assert.equal(ibEngine.normalizeCommissionType('PERCENTAGE'), 'PERCENT')
  assert.equal(ibEngine.normalizeCommissionType('PERCENT'), 'PERCENT')
  assert.equal(ibEngine.normalizeCommissionType('PER_LOT'), 'PER_LOT')
})

test('getPlanRateForLevel reads levels array first', async () => {
  const plan = {
    levels: [
      { level: 1, rate: 2 },
      { level: 2, rate: 1.5 },
    ],
  }
  assert.equal(ibEngine.getPlanRateForLevel(plan, 1), 2)
  assert.equal(ibEngine.getPlanRateForLevel(plan, 2), 1.5)
  assert.equal(ibEngine.getPlanRateForLevel(plan, 3), 0)
})

test('resolveCommissionConfig prefers plan rate when available', async () => {
  IBPlan.findById = async () => ({
    _id: 'plan1',
    name: 'Plan A',
    maxLevels: 3,
    commissionType: 'PER_LOT',
    levels: [{ level: 1, rate: 2 }],
  })
  IBLevel.findById = async () => ({
    _id: 'lvl1',
    name: 'Standard',
    commissionType: 'PER_LOT',
    downlineCommission: { level1: 5 },
  })
  IBLevel.findOne = async () => null

  const config = await ibEngine.resolveCommissionConfig(
    { ibPlanId: 'plan1', ibLevelId: 'lvl1', ibLevelOrder: 1 },
    1,
  )

  assert.equal(config.source, 'plan')
  assert.equal(config.rate, 2)
  assert.equal(config.commissionType, 'PER_LOT')
})

test('resolveCommissionConfig falls back to ib-level downline commission', async () => {
  IBPlan.findById = async () => ({
    _id: 'plan1',
    name: 'Plan Empty',
    maxLevels: 3,
    commissionType: 'PER_LOT',
    levels: [{ level: 1, rate: 0 }],
  })
  IBLevel.findById = async () => ({
    _id: 'lvl1',
    name: 'Standard',
    commissionType: 'PER_LOT',
    downlineCommission: { level1: 2, level2: 1 },
  })
  IBLevel.findOne = async () => null

  const config = await ibEngine.resolveCommissionConfig(
    { ibPlanId: 'plan1', ibLevelId: 'lvl1', ibLevelOrder: 1 },
    1,
  )

  assert.equal(config.source, 'ib-level')
  assert.equal(config.rate, 2)
})

test('resolveCommissionConfig supports legacy ibLevel fallback', async () => {
  IBPlan.findById = async () => null
  IBLevel.findById = async () => null
  IBLevel.findOne = async ({ order }) => {
    assert.equal(order, 4)
    return {
      _id: 'lvl4',
      name: 'Gold',
      commissionType: 'PER_LOT',
      downlineCommission: { level1: 5, level2: 2.5 },
    }
  }

  const config = await ibEngine.resolveCommissionConfig(
    { ibPlanId: null, ibLevel: 4, ibLevelOrder: null, ibLevelId: null },
    1,
  )

  assert.equal(config.source, 'ib-level')
  assert.equal(config.rate, 5)
})

// Commission processing paths
test('processTradeCommission PER_LOT uses configured rate', async () => {
  let created = null
  let credited = 0

  ibEngine.getIBChain = async () => [
    {
      ibUser: { _id: 'ib1', firstName: 'IB One', ibPlanId: 'plan1', ibLevelId: 'lvl1', ibLevelOrder: 1 },
      level: 1,
    },
  ]
  ibEngine.resolveCommissionConfig = async () => ({ rate: 2, commissionType: 'PER_LOT', source: 'plan' })
  ibEngine.getContractSize = () => 100000

  IBCommission.findOne = async () => null
  IBCommission.create = async (payload) => {
    created = payload
    return { _id: 'c1', ...payload }
  }

  IBWallet.getOrCreateWallet = async () => ({
    creditCommission: async (amount) => {
      credited += amount
    },
  })

  const result = await ibEngine.processTradeCommission({
    _id: 't1',
    tradeId: 'T-1',
    userId: 'trader1',
    symbol: 'EURUSD',
    quantity: 1,
    openPrice: 1.1,
  })

  assert.equal(result.processed, true)
  assert.equal(result.commissionsGenerated, 1)
  assert.equal(created.commissionAmount, 2)
  assert.equal(credited, 2)
})

test('processTradeCommission PERCENT uses trade value', async () => {
  let created = null

  ibEngine.getIBChain = async () => [
    {
      ibUser: { _id: 'ib1', firstName: 'IB One', ibPlanId: 'plan1', ibLevelId: 'lvl1', ibLevelOrder: 1 },
      level: 1,
    },
  ]
  ibEngine.resolveCommissionConfig = async () => ({ rate: 10, commissionType: 'PERCENT', source: 'plan' })
  ibEngine.getContractSize = () => 100

  IBCommission.findOne = async () => null
  IBCommission.create = async (payload) => {
    created = payload
    return { _id: 'c2', ...payload }
  }

  IBWallet.getOrCreateWallet = async () => ({
    creditCommission: async () => {},
  })

  await ibEngine.processTradeCommission({
    _id: 't2',
    tradeId: 'T-2',
    userId: 'trader1',
    symbol: 'XAUUSD',
    quantity: 2,
    openPrice: 100,
  })

  // tradeValue = 2 * 100 * 100 = 20000; 10% = 2000
  assert.equal(created.baseAmount, 20000)
  assert.equal(created.commissionAmount, 2000)
  assert.equal(created.commissionType, 'PERCENT')
})

test('processTradeCommission skips duplicate commission', async () => {
  ibEngine.getIBChain = async () => [
    {
      ibUser: { _id: 'ib1', firstName: 'IB One', ibPlanId: 'plan1', ibLevelId: 'lvl1', ibLevelOrder: 1 },
      level: 1,
    },
  ]
  ibEngine.resolveCommissionConfig = async () => ({ rate: 2, commissionType: 'PER_LOT', source: 'plan' })

  IBCommission.findOne = async () => ({ _id: 'already-exists' })
  IBCommission.create = async () => {
    throw new Error('Should not create duplicate commission')
  }

  IBWallet.getOrCreateWallet = async () => ({
    creditCommission: async () => {
      throw new Error('Should not credit duplicate commission')
    },
  })

  const result = await ibEngine.processTradeCommission({
    _id: 't3',
    tradeId: 'T-3',
    userId: 'trader1',
    symbol: 'EURUSD',
    quantity: 1,
    openPrice: 1,
  })

  assert.equal(result.commissionsGenerated, 0)
})

await run()
