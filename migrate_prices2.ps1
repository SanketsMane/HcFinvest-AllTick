$f = "C:\Users\DELL\Documents\HC-FINVEST - UPDATED - Copy\frontend\src\pages\TradingPage.jsx"
$c = [IO.File]::ReadAllText($f)
$ok = [System.Collections.Generic.List[string]]::new()
$miss = [System.Collections.Generic.List[string]]::new()

# ── A. selectedLiveQuote: replace livePrices → metaApiPrices ────────────────────────────
$old = '    const live = livePrices[selectedInstrument?.symbol] || {}'
$new = '    //Sanket v2.0 - Single source: metaApiPrices (per-tick event bus), fallback to selectedInstrument' + "`r`n" + '    const live = metaApiPrices[selectedInstrument?.symbol] || {}'
if ($c.Contains($old)) { $c = $c.Replace($old,$new); $ok.Add("A.selectedLiveQuote-live") } else { $miss.Add("A.selectedLiveQuote-live") }

# ── B. selectedLiveQuote bid priority: fix liveBid first → fallbackBid first ────────────
$oldB = "    const bid = Number.isFinite(liveBid) && liveBid > 0`r`n      ? liveBid`r`n      : (Number.isFinite(fallbackBid) && fallbackBid > 0 ? fallbackBid : 0)"
$newB = "    //Sanket v2.0 - Priority fix: selectedInstrument.bid (per-tick) first, metaApiPrices fallback`r`n    const bid = Number.isFinite(fallbackBid) && fallbackBid > 0`r`n      ? fallbackBid`r`n      : (Number.isFinite(liveBid) && liveBid > 0 ? liveBid : 0)"
if ($c.Contains($oldB)) { $c = $c.Replace($oldB,$newB); $ok.Add("B.selectedLiveQuote-bid-priority-CRLF") } else { $miss.Add("B.selectedLiveQuote-bid-priority-CRLF") }

$oldBb = "    const bid = Number.isFinite(liveBid) && liveBid > 0`n      ? liveBid`n      : (Number.isFinite(fallbackBid) && fallbackBid > 0 ? fallbackBid : 0)"
$newBb = "    //Sanket v2.0 - Priority fix: selectedInstrument.bid (per-tick) first, metaApiPrices fallback`n    const bid = Number.isFinite(fallbackBid) && fallbackBid > 0`n      ? fallbackBid`n      : (Number.isFinite(liveBid) && liveBid > 0 ? liveBid : 0)"
if ($c.Contains($oldBb)) { $c = $c.Replace($oldBb,$newBb); $ok.Add("B.selectedLiveQuote-bid-priority-LF") } else { $miss.Add("B.selectedLiveQuote-bid-priority-LF") }

# ── C. selectedLiveQuote ask priority: fix liveAsk first → fallbackAsk first ────────────
$oldC = "    const askFromSources = Number.isFinite(liveAsk) && liveAsk > 0`r`n      ? liveAsk`r`n      : (Number.isFinite(fallbackAsk) && fallbackAsk > 0 ? fallbackAsk : bid)"
$newC = "    const askFromSources = Number.isFinite(fallbackAsk) && fallbackAsk > 0`r`n      ? fallbackAsk`r`n      : (Number.isFinite(liveAsk) && liveAsk > 0 ? liveAsk : bid)"
if ($c.Contains($oldC)) { $c = $c.Replace($oldC,$newC); $ok.Add("C.selectedLiveQuote-ask-priority-CRLF") } else { $miss.Add("C.selectedLiveQuote-ask-priority-CRLF") }
$oldCb = "    const askFromSources = Number.isFinite(liveAsk) && liveAsk > 0`n      ? liveAsk`n      : (Number.isFinite(fallbackAsk) && fallbackAsk > 0 ? fallbackAsk : bid)"
$newCb = "    const askFromSources = Number.isFinite(fallbackAsk) && fallbackAsk > 0`n      ? fallbackAsk`n      : (Number.isFinite(liveAsk) && liveAsk > 0 ? liveAsk : bid)"
if ($c.Contains($oldCb)) { $c = $c.Replace($oldCb,$newCb); $ok.Add("C.selectedLiveQuote-ask-priority-LF") } else { $miss.Add("C.selectedLiveQuote-ask-priority-LF") }

# ── D. selectedLiveQuote useMemo deps ────────────────────────────────────────────────────
$old = '  }, [livePrices, selectedInstrument?.symbol, selectedInstrument?.bid, selectedInstrument?.ask])'
$new = '  }, [metaApiPrices, selectedInstrument?.symbol, selectedInstrument?.bid, selectedInstrument?.ask])'
if ($c.Contains($old)) { $c = $c.Replace($old,$new); $ok.Add("D.selectedLiveQuote-deps") } else { $miss.Add("D.selectedLiveQuote-deps") }

# ── E. displayFloatingPnl useEffect deps ─────────────────────────────────────────────────
$old = '  }, [accountSummary?.floatingPnl, openTrades.length, livePrices])'
$new = '  }, [accountSummary?.floatingPnl, openTrades.length, metaApiPrices])'
if ($c.Contains($old)) { $c = $c.Replace($old,$new); $ok.Add("E.displayFloatingPnl-deps") } else { $miss.Add("E.displayFloatingPnl-deps") }

# ── F. Remove setLivePrices block in second subscribe (L3790-3799) ────────────────────────
# Match the 10-line setLivePrices block, CRLF variant
$oldF = "        setLivePrices(prev => ({`r`n          ...prev,`r`n          [selectedSymbol]: {`r`n            ...prev[selectedSymbol],`r`n            ...selectedTick,`r`n            bid: selectedBid,`r`n            ask: selectedAsk,`r`n            spread: Math.abs(selectedAsk - selectedBid)`r`n          }`r`n        }))"
$newF = "        //Sanket v2.0 - Removed setLivePrices block; selectedInstrument updated below is sufficient"
if ($c.Contains($oldF)) { $c = $c.Replace($oldF,$newF); $ok.Add("F.setLivePrices-subscribe2-CRLF") } else { $miss.Add("F.setLivePrices-subscribe2-CRLF") }

# LF variant
$oldFb = "        setLivePrices(prev => ({`n          ...prev,`n          [selectedSymbol]: {`n            ...prev[selectedSymbol],`n            ...selectedTick,`n            bid: selectedBid,`n            ask: selectedAsk,`n            spread: Math.abs(selectedAsk - selectedBid)`n          }`n        }))"
if ($c.Contains($oldFb)) { $c = $c.Replace($oldFb,$newF); $ok.Add("F.setLivePrices-subscribe2-LF") } else { $miss.Add("F.setLivePrices-subscribe2-LF") }

# ── G. Floating PnL waterfall: replace livePrices[...] block ────────────────────────────
# The exact text at L4084-4090 (CRLF)
$oldG = "        //Sanket v2.0 - Look up price: live first, then lastValidPricesRef cache, then instrument fallback`r`n        const livePrice = livePrices[targetSym] || `r`n                        livePrices[targetSym.toUpperCase()] || `r`n                        livePrices[targetSym.toLowerCase()] ||`r`n                        livePrices[targetSym.replace(/\.i`$/i, '').toUpperCase()] ||`r`n                        lastValidPricesRef.current[targetSym] ||`r`n                        lastValidPricesRef.current[targetSym.toUpperCase()];"
$newG = "        //Sanket v2.0 - Single source: metaApiPrices (per-tick), then instruments, then cache`r`n        const livePrice = metaApiPrices[targetSym] ||`r`n                        metaApiPrices[targetSym.toUpperCase()] ||`r`n                        instruments.find(i => i.symbol === targetSym || i.symbol === targetSym.toUpperCase()) ||`r`n                        lastValidPricesRef.current[targetSym] ||`r`n                        lastValidPricesRef.current[targetSym.toUpperCase()];"
if ($c.Contains($oldG)) { $c = $c.Replace($oldG,$newG); $ok.Add("G.floatingPnL-waterfall-CRLF") } else { $miss.Add("G.floatingPnL-waterfall-CRLF") }

# LF variant
$oldGb = "        //Sanket v2.0 - Look up price: live first, then lastValidPricesRef cache, then instrument fallback`n        const livePrice = livePrices[targetSym] || `n                        livePrices[targetSym.toUpperCase()] || `n                        livePrices[targetSym.toLowerCase()] ||`n                        livePrices[targetSym.replace(/\.i`$/i, '').toUpperCase()] ||`n                        lastValidPricesRef.current[targetSym] ||`n                        lastValidPricesRef.current[targetSym.toUpperCase()];"
if ($c.Contains($oldGb)) { $c = $c.Replace($oldGb,$newG); $ok.Add("G.floatingPnL-waterfall-LF") } else { $miss.Add("G.floatingPnL-waterfall-LF") }

# ── H. Floating PnL useEffect deps (the 3-elem one) ────────────────────────────────────
$old = '  }, [livePrices, instruments, openTrades])'
$new = '  //Sanket v2.0 - Single source of truth: metaApiPrices+instruments (per-tick), livePrices removed' + "`r`n" + '  }, [metaApiPrices, instruments, openTrades])'
if ($c.Contains($old)) { $c = $c.Replace($old,$new); $ok.Add("H.floatingPnL-deps-3elem") } else { $miss.Add("H.floatingPnL-deps-3elem") }

# ── I. AnimatedTradeRow waterfall (L5778-5783) ───────────────────────────────────────────
# Note: This is the JSX region, different comment text than floating PnL
$oldI = "                      const livePrice = livePrices[targetSym] || `r`n                                      livePrices[targetSym.toUpperCase()] || `r`n                                      livePrices[targetSym.toLowerCase()] ||`r`n                                      livePrices[baseSym] ||`r`n                                      lastValidPricesRef.current[targetSym] ||`r`n                                      lastValidPricesRef.current[baseSym];"
$newI = "                      //Sanket v2.0 - Single source: metaApiPrices (per-tick), then instruments, then cache`r`n                      const livePrice = metaApiPrices[targetSym] || metaApiPrices[baseSym] ||`r`n                                      instruments.find(i => i.symbol === targetSym || i.symbol === baseSym) ||`r`n                                      lastValidPricesRef.current[targetSym] ||`r`n                                      lastValidPricesRef.current[baseSym];"
if ($c.Contains($oldI)) { $c = $c.Replace($oldI,$newI); $ok.Add("I.AnimatedTradeRow-CRLF") } else { $miss.Add("I.AnimatedTradeRow-CRLF") }

$oldIb = "                      const livePrice = livePrices[targetSym] || `n                                      livePrices[targetSym.toUpperCase()] || `n                                      livePrices[targetSym.toLowerCase()] ||`n                                      livePrices[baseSym] ||`n                                      lastValidPricesRef.current[targetSym] ||`n                                      lastValidPricesRef.current[baseSym];"
$newIb = "                      //Sanket v2.0 - Single source: metaApiPrices (per-tick), then instruments, then cache`n                      const livePrice = metaApiPrices[targetSym] || metaApiPrices[baseSym] ||`n                                      instruments.find(i => i.symbol === targetSym || i.symbol === baseSym) ||`n                                      lastValidPricesRef.current[targetSym] ||`n                                      lastValidPricesRef.current[baseSym];"
if ($c.Contains($oldIb)) { $c = $c.Replace($oldIb,$newIb); $ok.Add("I.AnimatedTradeRow-LF") } else { $miss.Add("I.AnimatedTradeRow-LF") }

# ── J. Add SYNC_CHECK console.log to handleMetaApiPriceUpdate ────────────────────────────
# Insert after setMetaApiPrices call in handleMetaApiPriceUpdate
$oldJ = "      // Update MetaAPI prices state`r`n      setMetaApiPrices(prev => ({`r`n        ...prev,`r`n        [symbol]: { bid, ask, time }`r`n      }))"
$newJ = "      // Update MetaAPI prices state`r`n      setMetaApiPrices(prev => ({`r`n        ...prev,`r`n        [symbol]: { bid, ask, time }`r`n      }))`r`n      //Sanket v2.0 - SYNC_CHECK: verify all price consumers update from same event bus`r`n      // console.log('SYNC_CHECK', { symbol, bid, ask, time: Date.now() })"
if ($c.Contains($oldJ)) { $c = $c.Replace($oldJ,$newJ); $ok.Add("J.SYNC_CHECK-CRLF") } else { $miss.Add("J.SYNC_CHECK-CRLF") }

$oldJb = "      // Update MetaAPI prices state`n      setMetaApiPrices(prev => ({`n        ...prev,`n        [symbol]: { bid, ask, time }`n      }))"
$newJb = "      // Update MetaAPI prices state`n      setMetaApiPrices(prev => ({`n        ...prev,`n        [symbol]: { bid, ask, time }`n      }))`n      //Sanket v2.0 - SYNC_CHECK: verify all price consumers update from same event bus`n      // console.log('SYNC_CHECK', { symbol, bid, ask, time: Date.now() })"
if ($c.Contains($oldJb)) { $c = $c.Replace($oldJb,$newJb); $ok.Add("J.SYNC_CHECK-LF") } else { $miss.Add("J.SYNC_CHECK-LF") }

# ── Write file ───────────────────────────────────────────────────────────────────────────
[IO.File]::WriteAllText($f, $c)

Write-Host "=== SUCCESS ==="
foreach ($s in $ok) { Write-Host "  OK: $s" }
Write-Host "=== MISSED ==="
foreach ($s in $miss) { Write-Host "  MISS: $s" }

# Final scan
Write-Host "`n=== Final active livePrices refs (non-comment lines) ==="
$num=0
foreach ($line in ($c -split "`n")) {
    $num++
    if ($line -match 'livePrices' -and $line -notmatch '^\s*//' -and $line -notmatch '^\s+\*' -and $line -notmatch '\{/\*' ) {
        "  L$num`: $($line.Trim())" | Out-File final_scan.txt -Append -Encoding ascii
    }
}
Get-Content final_scan.txt
