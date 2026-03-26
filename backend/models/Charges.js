import mongoose from 'mongoose'

const chargesSchema = new mongoose.Schema({
  // Hierarchy level - higher priority overrides lower
  // Priority: USER > INSTRUMENT > SEGMENT > ACCOUNT_TYPE > GLOBAL
  level: {
    type: String,
    enum: ['USER', 'INSTRUMENT', 'SEGMENT', 'ACCOUNT_TYPE', 'GLOBAL'],
    required: true
  },
  // Reference IDs based on level
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  instrumentSymbol: {
    type: String,
    default: null
  },
  segment: {
    type: String,
    enum: ['Forex', 'Crypto', 'Commodities', 'Indices', 'Metals', null],
    default: null
  },
  accountTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountType',
    default: null
  },
  
  // ============ SPREAD SETTINGS ============
  // Spread is added to the price (BUY gets higher price, SELL gets lower price)
  // For Forex: Value in PIPS (e.g., 1.5 = 1.5 pips = 0.00015 for EURUSD, 0.015 for USDJPY)
  // For Metals: Value in cents (e.g., 50 = $0.50 for XAUUSD)
  // For Crypto: Value in USD (e.g., 10 = $10 spread)
  spreadType: {
    type: String,
    enum: ['FIXED', 'PERCENTAGE'],
    default: 'FIXED'
  },
  spreadValue: {
    type: Number,
    default: 0
  },
  
  // ============ COMMISSION SETTINGS ============
  // Commission charged per lot on each execution (buy/sell/close)
  commissionType: {
    type: String,
    enum: ['PER_LOT', 'PER_TRADE', 'PERCENTAGE'],
    default: 'PER_LOT'
  },
  commissionValue: {
    type: Number,
    default: 0
  },
  // When to charge commission
  commissionOnBuy: {
    type: Boolean,
    default: true
  },
  commissionOnSell: {
    type: Boolean,
    default: true
  },
  commissionOnClose: {
    type: Boolean,
    default: false
  },
  
  // ============ SWAP SETTINGS ============
  // Overnight fees (charged daily at rollover time)
  swapLong: {
    type: Number,
    default: 0
  },
  swapShort: {
    type: Number,
    default: 0
  },
  swapType: {
    type: String,
    enum: ['POINTS', 'PERCENTAGE'],
    default: 'POINTS'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Compound index for efficient lookups
chargesSchema.index({ level: 1, userId: 1, instrumentSymbol: 1, segment: 1, accountTypeId: 1 })

// Static method to get applicable charges for a trade
// Priority: USER > INSTRUMENT > ACCOUNT_TYPE > SEGMENT > GLOBAL
// Merges charges from multiple levels - most specific wins for each field
chargesSchema.statics.getChargesForTrade = async function(userId, symbol, segment, accountTypeId) {
  const normalizeSymbol = (s = '') => String(s).toUpperCase().replace(/\.I$/i, '')
  const normSymbol = normalizeSymbol(symbol)
  
  console.log(`Getting charges for: userId=${userId}, symbol=${symbol} (norm: ${normSymbol}), segment=${segment}, accountTypeId=${accountTypeId}`)
  
  // Build query to find all potentially applicable charges
  const allCharges = await this.find({ isActive: true }).sort({ createdAt: -1 })
  
  // Filter charges that apply to this trade
  let applicableCharges = allCharges.filter(charge => {
    // Normalize stored instrument symbol for comparison
    const chargeSymbol = charge.instrumentSymbol ? normalizeSymbol(charge.instrumentSymbol) : null

    // USER level - must match userId
    if (charge.level === 'USER') {
      if (!charge.userId || charge.userId.toString() !== userId?.toString()) return false
      // If instrument is specified, must match
      if (chargeSymbol && chargeSymbol !== normSymbol) return false
      return true
    }
    
    // INSTRUMENT level - must match symbol
    if (charge.level === 'INSTRUMENT') {
      if (chargeSymbol !== normSymbol) return false
      // If accountTypeId is specified, must match
      if (charge.accountTypeId && charge.accountTypeId.toString() !== accountTypeId?.toString()) return false
      return true
    }
    
    // ACCOUNT_TYPE level - must match accountTypeId
    if (charge.level === 'ACCOUNT_TYPE') {
      if (!charge.accountTypeId || charge.accountTypeId.toString() !== accountTypeId?.toString()) return false
      // If segment is specified, must match
      if (charge.segment && charge.segment !== segment) return false
      return true
    }
    
    // SEGMENT level - must match segment
    if (charge.level === 'SEGMENT') {
      if (charge.segment !== segment) return false
      return true
    }
    
    // GLOBAL level - always applies
    if (charge.level === 'GLOBAL') {
      return true
    }
    
    return false
  })
  
  // Sort by priority (least specific first: GLOBAL -> SEGMENT -> ACCOUNT_TYPE -> INSTRUMENT -> USER)
  const priorityOrder = { 'GLOBAL': 1, 'SEGMENT': 2, 'ACCOUNT_TYPE': 3, 'INSTRUMENT': 4, 'USER': 5 }
  applicableCharges.sort((a, b) => priorityOrder[a.level] - priorityOrder[b.level])
  
  console.log(`Found ${applicableCharges.length} applicable charges for merging`)
  
  // We iterate through all applicable charges from LEAST specific to MOST specific.
  // This allows more specific levels to overwrite less specific ones.
  // Within the same level, we accumulate non-zero values to support split documents (e.g., one for spread, one for commission).
  const result = {
    spreadType: 'FIXED',
    spreadValue: 0,
    commissionType: 'PER_LOT',
    commissionValue: 0,
    commissionOnBuy: true,
    commissionOnSell: true,
    commissionOnClose: false,
    swapLong: 0,
    swapShort: 0,
    swapType: 'POINTS'
  }
  
  // Track which fields were set by which priority level
  const levelsSet = { spread: 0, commission: 0, swap: 0 }

  for (const charge of applicableCharges) {
    const chargeLevelPriority = priorityOrder[charge.level]

    // Spread Merging
    if (charge.spreadValue !== undefined && charge.spreadValue !== null) {
      const isNewerPriority = chargeLevelPriority > levelsSet.spread
      const isFillingEmpty = chargeLevelPriority === levelsSet.spread && charge.spreadValue !== 0
      
      if (isNewerPriority || isFillingEmpty) {
        result.spreadValue = charge.spreadValue
        result.spreadType = charge.spreadType
        levelsSet.spread = chargeLevelPriority
      }
    }

    // Commission Merging
    if (charge.commissionValue !== undefined && charge.commissionValue !== null) {
      const isNewerPriority = chargeLevelPriority > levelsSet.commission
      const isFillingEmpty = chargeLevelPriority === levelsSet.commission && charge.commissionValue !== 0
      
      if (isNewerPriority || isFillingEmpty) {
        result.commissionValue = charge.commissionValue
        result.commissionType = charge.commissionType
        result.commissionOnBuy = charge.commissionOnBuy
        result.commissionOnSell = charge.commissionOnSell
        result.commissionOnClose = charge.commissionOnClose
        levelsSet.commission = chargeLevelPriority
      }
    }

    // Swap Merging
    if ((charge.swapLong !== undefined && charge.swapLong !== null) || 
        (charge.swapShort !== undefined && charge.swapShort !== null)) {
      const hasValue = (charge.swapLong || 0) !== 0 || (charge.swapShort || 0) !== 0
      const isNewerPriority = chargeLevelPriority > levelsSet.swap
      const isFillingEmpty = chargeLevelPriority === levelsSet.swap && hasValue
      
      if (isNewerPriority || isFillingEmpty) {
        result.swapLong = charge.swapLong || 0
        result.swapShort = charge.swapShort || 0
        result.swapType = charge.swapType
        levelsSet.swap = chargeLevelPriority
      }
    }
  }

  // add these line of  code to make changes in speard 

    // Fallback to AccountType defaults if no specific charges found
  if (accountTypeId) {
    const AccountType = mongoose.model('AccountType')
    const accountType = await AccountType.findById(accountTypeId)
    if (accountType) {
      if (result.spreadValue === 0 && accountType.minSpread > 0) {
        result.spreadValue = accountType.minSpread
        result.spreadType = 'FIXED'
      }
      if (result.commissionValue === 0 && accountType.commission > 0) {
        result.commissionValue = accountType.commission
        result.commissionType = 'PER_LOT'
      }
      if (accountType.minSpread > 0 || accountType.commission > 0) {
        console.log(`Using AccountType defaults: spread=${result.spreadValue}, commission=${result.commissionValue}`)
      }
    }
  }
  


  
  console.log(`Final charges: spread=${result.spreadValue}, commission=${result.commissionValue}, swapLong=${result.swapLong}, swapShort=${result.swapShort}`)
  
  return result
}

export default mongoose.model('Charges', chargesSchema)
