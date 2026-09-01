"use client"
import { Button } from '@/components/atoms/Button'
import { useUIModals } from '@/hooks/useUIModal'
import { Plus } from 'lucide-react'

import React from 'react'

const PaymentCategoryHead = () => {
    const { openAddCateGoryForm } = useUIModals()

    return (

        < div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border" >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg border border-primary/20 shrink-0">
                    🏦
                </div>
                <div>
                    <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight">
                        Money Accounts
                    </h1>
                    <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide">
                        Manage your money accounts, banks, and staff balances
                    </p>
                </div>
            </div>
            <Button onClick={() => openAddCateGoryForm()} className="bg-primary text-text-invert hover:opacity-90 shadow-glow font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 shrink-0">
                <Plus size={14} /> New Category
            </Button>
        </div >
    )
}

export default PaymentCategoryHead