import dynamic from "next/dynamic";

export const MODAL_COMPONENTS: Record<string, React.ComponentType<any>> = {
    GUARDIAN_FORM: dynamic(() => import("./guardians/GuardianModal").then(mod => mod.GuardianModal)),
    GUARDIAN_DOSSIER: dynamic(() => import("./guardians/GuardianDossierModal").then(mod => mod.GuardianDossierModal)),
    ASSIGN_CHILD: dynamic(() => import("./guardians/AssignChildModal").then(mod => mod.AssignChildModal)),
    MODIFY_PLACEMENTS: dynamic(() => import("./guardians/ModifyPlacements").then(mod => mod.ModifyPlacementsModal)),

    CHILD_FORM: dynamic(() => import("./child/ChildForm").then(mod => mod.ChildForm)),
    CHILD_ACTION: dynamic(() => import("./child/ChildAction").then(mod => mod.ChildAction)),
    CHILD_PROFILE: dynamic(() => import("./child/ViewChildModal").then(mod => mod.ChildDossierModal)),
    CHILD_STATUS: dynamic(() => import("./child/AddCurrentStatusModal").then(mod => mod.default)),

    STAFF_FORM: dynamic(() => import("./staff/StaffForm").then(mod => mod.StaffForm)),
    INTERNAL_TRANSFER: dynamic(() => import("./finances/transaction/InternalTransfers").then(mod => mod.InternalTransferForm)),
    TRANSACTION_FORM: dynamic(() => import("./finances/transaction/TransactionForm").then(mod => mod.TransactionForm)),
    ACCOUNT_HEAD_FORM: dynamic(() => import("./finances/accountHead/AccountHeadForm").then(mod => mod.AccountHeadForm)),
    PAYMENT_CATEGORY_FORM: dynamic(() => import("./finances/category/PaymentCategoryModal")),
    MANAGE_STOCK: dynamic(() => import("./finances/inventory/ManageStockModal").then(mod => mod.ManageStockModal)),
    INVENTORY_ITEM_FORM: dynamic(() => import("./finances/inventory/InventoryItemForm").then(mod => mod.InventoryItemForm)),
    
    CONSUMABLE_CAT_FORM: dynamic(() => import("./finances/inventory/AddConsumableCategoryModal").then(mod => mod.ConsumableForm)),
    ASSET_CAT_FORM: dynamic(() => import("./finances/inventory/AddFixedAssetCategoryForm").then(mod => mod.AddAssetCategoryModal)),
    BULK_EXPENSE_UPLOAD: dynamic(() => import("./finances/transaction/BulkExpenseUploadModal").then(mod => mod.BulkExpenseUploadModal)),
    TRANSACTION_DETAIL: dynamic(() => import("./finances/transaction/TransactionDetailModal").then(mod => mod.TransactionDetailModal)),
};  