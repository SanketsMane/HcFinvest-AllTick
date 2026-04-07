$f = 'frontend\src\pages\TradingPage.jsx'
$c = [IO.File]::ReadAllText($f)

# The duplicate block starts right after the first handler's closing line
# Find: }\r\n  }, [selectedInstrument?.symbol])\r\n\r\n  //Sanket v2.0 - Single source of truth: listen to priceUpdate
# And replace by removing from the second occurrence onward

$dupStart = "  }, [selectedInstrument?.symbol])`r`n`r`n  //Sanket v2.0 - Single source of truth: listen to priceUpdate events, update metaApiPrices per-tick`r`n  useEffect(() => {"
$dupEnd = "    priceEventTarget.removeEventListener('priceUpdate', handleMetaApiPriceUpdate)`r`n  }, [selectedInstrument?.symbol])`r`n`r`n  useEffect(() => {`r`n    if (!selectedInstrument?.symbol) return"

$dupFull = $dupStart + "`r`n    const priceEventTarget = getPriceEvents()`r`n`r`n    const handleMetaApiPriceUpdate = (event) => {`r`n      const { symbol, bid, ask, time } = event.detail`r`n      //Sanket v2.0 - SINGLE SOURCE: update metaApiPrices (the price bus) per-tick from priceUpdate event`r`n      setMetaApiPrices(prev => ({`r`n        ...prev,`r`n        [symbol]: { bid, ask, time }`r`n      }))`r`n      //Sanket v2.0 - SYNC_CHECK: uncomment to verify all consumers update from same tick`r`n      // console.log('SYNC_CHECK', { symbol, bid, ask, time: Date.now() })`r`n      if (selectedInstrument?.symbol === symbol) {`r`n        setSelectedInstrument(prev => ({ ...prev, bid, ask, spread: Math.abs(ask - bid) }))`r`n      }`r`n      setInstruments(prev => prev.map(inst =>`r`n        inst.symbol === symbol ? { ...inst, bid, ask, spread: Math.abs(ask - bid) } : inst`r`n      ))`r`n      setOpenTabs(prev => prev.map(tab =>`r`n        tab.symbol === symbol ? { ...tab, bid, ask, spread: Math.abs(ask - bid) } : tab`r`n      ))`r`n    }`r`n`r`n    priceEventTarget.addEventListener('priceUpdate', handleMetaApiPriceUpdate)`r`n    return () => " + $dupEnd

$replacement = "  }, [selectedInstrument?.symbol])`r`n`r`n  useEffect(() => {`r`n    if (!selectedInstrument?.symbol) return"

if ($c.Contains($dupFull)) {
    $c = $c.Replace($dupFull, $replacement)
    [IO.File]::WriteAllText($f, $c)
    Write-Output "OK: duplicate removed"
} else {
    Write-Output "MISS: exact duplicate string not found - checking count of handler blocks"
    $count = ([regex]::Matches($c, [regex]::Escape("priceEventTarget.addEventListener('priceUpdate', handleMetaApiPriceUpdate)"))).Count
    Write-Output "priceUpdate addEventListener count: $count"
}
