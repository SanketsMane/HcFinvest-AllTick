import { useState, useEffect, useRef } from 'react';

/**
 * useInterpolation - A production-grade price interpolation hook
 * 
 * Transforms "jumpy" tick data into smooth, frame-based movement.
 * Supports both single numeric values and dual price objects { bid, ask }.
 * 
 * @param {number|object} target - The latest price/prices from the WebSocket
 * @param {number} smoothingFactor - Speed of interpolation (0.1 - 0.3 recommended)
 * @param {number} epsilon - Threshold to snap to target
 */
export const useInterpolation = (target, smoothingFactor = 0.2, epsilon = 0.00001) => {
  const isObject = typeof target === 'object' && target !== null && 'bid' in target && 'ask' in target;
  
  const [displayPrice, setDisplayPrice] = useState(target);
  
  const targetRef = useRef(target);
  const displayRef = useRef(target);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  // Sync target ref when target changes
  useEffect(() => {
    if (target === null || target === undefined) return;
    
    // Check for large jumps (teleportation)
    let shouldTeleport = false;
    if (isObject) {
      const bidDiff = Math.abs(target.bid - (targetRef.current?.bid || 0));
      const askDiff = Math.abs(target.ask - (targetRef.current?.ask || 0));
      const threshold = (targetRef.current?.bid || 1) * 0.01;
      shouldTeleport = bidDiff > threshold || askDiff > threshold;
    } else {
      const diff = Math.abs(target - targetRef.current);
      const threshold = (targetRef.current || 1) * 0.01;
      shouldTeleport = diff > threshold && targetRef.current !== 0;
    }
    
    if (shouldTeleport) {
      displayRef.current = target;
      setDisplayPrice(target);
    }

    targetRef.current = target;
  }, [target, isObject]);

  const animate = (time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = (time - previousTimeRef.current) / 1000; // in seconds
      
      const targetVal = targetRef.current;
      const currentVal = displayRef.current;
      
      if (!targetVal) {
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const speed = smoothingFactor * 60;
      const lerpFactor = Math.min(1, speed * deltaTime);

      if (isObject) {
        const nextBid = currentVal.bid + (targetVal.bid - currentVal.bid) * lerpFactor;
        const nextAsk = currentVal.ask + (targetVal.ask - currentVal.ask) * lerpFactor;
        
        const bidSnapped = Math.abs(targetVal.bid - nextBid) < epsilon;
        const askSnapped = Math.abs(targetVal.ask - nextAsk) < epsilon;
        
        const finalBid = bidSnapped ? targetVal.bid : nextBid;
        const finalAsk = askSnapped ? targetVal.ask : nextAsk;
        
        displayRef.current = { bid: finalBid, ask: finalAsk };
        setDisplayPrice({ bid: finalBid, ask: finalAsk });
      } else {
        if (Math.abs(targetVal - currentVal) < epsilon) {
          if (currentVal !== targetVal) {
            displayRef.current = targetVal;
            setDisplayPrice(targetVal);
          }
        } else {
          const nextPrice = currentVal + (targetVal - currentVal) * lerpFactor;
          displayRef.current = nextPrice;
          setDisplayPrice(nextPrice);
        }
      }
    }
    
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      } else {
        previousTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [smoothingFactor, epsilon, isObject]);

  return displayPrice;
};
