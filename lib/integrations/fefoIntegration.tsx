/**
 * POS Integration Guide - FEFO Batch Selector
 * 
 * This file shows how to integrate the FEFO batch selector into the POS workflow
 */

import { useState } from 'react';
import { FEFOBatchSelector } from '@/components/pos/FEFOBatchSelector';
import { getFEFORecommendation, logFEFODeviation } from '@/lib/hooks/usePOSScan';
import type { FEFORecommendation } from '@/lib/api/fefo';

/**
 * Example: How to use FEFO batch selector when adding a product
 */

export function useFEFOBatchSelection() {
    const [showFEFOSelector, setShowFEFOSelector] = useState(false);
    const [fefoRecommendation, setFEFORecommendation] = useState<FEFORecommendation | null>(null);
    const [currentDrug, setCurrentDrug] = useState<any>(null);

    const handleProductSelection = async (product: any, onAddToBasket: (item: any) => void) => {
        // If product has multiple batches, show FEFO selector
        if (product.batchCount > 1 || !product.batchId) {
            // Get FEFO recommendation
            const recommendation = await getFEFORecommendation(product.drugId || product.id, 1);

            if (recommendation) {
                setFEFORecommendation(recommendation);
                setCurrentDrug(product);
                setShowFEFOSelector(true);
            } else {
                // No batches available or API error - add product as-is
                onAddToBasket(product);
            }
        } else {
            // Single batch - add directly
            onAddToBasket(product);
        }
    };

    const handleBatchSelected = (batchId: string, isOverride: boolean, reason?: string) => {
        if (!currentDrug || !fefoRecommendation) return;

        // Create basket item with selected batch
        const basketItem = {
            ...currentDrug,
            batchId,
            batchNumber: isOverride
                ? fefoRecommendation.alternativeBatches.find(b => b.id === batchId)?.batchNumber
                : fefoRecommendation.batchNumber,
            scanned: false, // Added via selection, not scan
            fefoOverride: isOverride,
            overrideReason: reason
        };

        // Add to basket (you'll pass this function from parent)
        // onAddToBasket(basketItem);

        // Log deviation if override (will be saved when sale completes)
        if (isOverride) {
            // Store for later logging with sale
            basketItem._pendingFEFOLog = {
                recommendedBatchId: fefoRecommendation.recommendedBatchId,
                actualBatchId: batchId,
                reason
            };
        }

        setShowFEFOSelector(false);
        setCurrentDrug(null);
        setFEFORecommendation(null);
    };

    return {
        showFEFOSelector,
        fefoRecommendation,
        currentDrug,
        handleProductSelection,
        handleBatchSelected,
        FEFOSelectorComponent: showFEFOSelector ? (
            <FEFOBatchSelector
                drugId={currentDrug?.drugId || currentDrug?.id}
                drugName={currentDrug?.name}
                quantity={1}
                recommendation={fefoRecommendation!}
                onSelectBatch={handleBatchSelected}
                onCancel={() => {
                    setShowFEFOSelector(false);
                    setCurrentDrug(null);
                }}
                isOpen={showFEFOSelector}
            />
        ) : null
  };
}

/**
 * After sale completion, log any FEFO deviations
 */
export async function logSaleFEFODeviations(saleId: string, basketItems: any[]) {
    const deviations = basketItems.filter(item => item._pendingFEFOLog);

    for (const item of deviations) {
        await logFEFODeviation(
            saleId,
            item.drugId,
            item._pendingFEFOLog.recommendedBatchId,
            item._pendingFEFOLog.actualBatchId,
            item._pendingFEFOLog.reason
        );
    }
}
