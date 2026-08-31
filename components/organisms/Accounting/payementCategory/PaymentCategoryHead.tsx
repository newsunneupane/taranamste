"use client"
import { Button } from '@/components/atoms/Button'
import { useUIModals } from '@/hooks/useUIModal'
import { Plus } from 'lucide-react'

import React from 'react'

const PaymentCategoryHead = () => {
    const { openAddCateGoryForm } = useUIModals()

    return (

        < div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-8" >
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-text">
                    Money Accounts
                </h1>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-2">
                    Manage your money accounts, banks, and staff balances
                </p>
            </div>
            {/* For simplicity, we'll use a link to a sub-route or a modal */}
            <Button onClick={() => openAddCateGoryForm()} className="btn-primary flex items-center gap-2 h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                <Plus size={16} /> New Category
            </Button>
        </div >
    )
}

export default PaymentCategoryHead