"use client";
import { useModal } from "@/providers/ModalsManager";

export function useUIModals() {
    const { openModal, closeModal } = useModal();

    return {
        // --- GUARDIAN ---
        openGuardianModal: ({ data }: { data?: any } = {}) =>
            openModal(
                "GUARDIAN_FORM",
                !!data ? "Update Guardian" : "New Guardian Form",
                { initialData: data, mode: !!data ? "EDIT" : "ADD" }
            ),

        openGuardianDossier: ({ guardianId }: { guardianId: string }) =>
            openModal(
                "GUARDIAN_DOSSIER",
                "Guardian Profile", // Fixed typo: "Guardain" -> "Guardian"
                { id: guardianId }
            ),

        openAssignChildrenModal: ({ guardianId }: { guardianId: string }) =>
            openModal(
                "ASSIGN_CHILD",
                "Assign Children",
                { guardianId }
            ),

        openModifyPlacementsModal: ({ guardian }: { guardian: any }) =>
            openModal(
                "MODIFY_PLACEMENTS",
                "Modify Placements",
                { guardian }
            ),

        // --- CHILD ---
        openChildModal: ({ data }: { data?: any } = {}) => {


            openModal(
                "CHILD_FORM",
                !!data ? "Update Child" : "Admit Child",
                { initialData: data }
            )
        },


        openChildActions: ({ childId }: { childId: string }) => {
            openModal(
                "CHILD_ACTION",
                "Child Action",
                { childId }
            )
        },

        openChildProfile: ({ child }: { child: any }) => {

            openModal(
                "CHILD_PROFILE",
                `${child.firstName}'s Profile`,
                { child }
            )
        },
        openChildStatusCategoriesForm: ({ onSaved }: { onSaved: () => void }) => {
            openModal(
                "CHILD_STATUS",
                `child status catagories`,
                { onSaved }
            )
        },

        // --- STAFF ---
        openStaffForm: ({ staff, pendingUsers }: { staff?: any, pendingUsers?: any[] } = {}) =>
            openModal(
                "STAFF_FORM",
                !!staff ? "Update Staff" : "Add New Staff",
                { initialData: staff, pendingUsers } // This goes to the StaffForm component
            ),

        // --- TRANSACTION / FINANCE ---
        openTransactionForm: ({ initialData }: { initialData?: any } = {}) =>
            openModal(
                "TRANSACTION_FORM",
                !!initialData ? "Edit Transaction" : "New Transaction",
                { initialData }
            ),
        openAddCateGoryForm: ({ initialData, onSaved ,defaultIdentifier}: { onSaved?: () => void, initialData?: any,defaultIdentifier?:any } = {}) => {
            openModal(
                "PAYMENT_CATEGORY_FORM",
                "Add Category",
                { onSaved, initialData ,defaultIdentifier} // ✨ Pass the callback into the modal props
            );
        },
        // Inside useUIModals.ts
        openAddConsumableCategory: ({onSaved}: any) => {
            openModal("CONSUMABLE_CAT_FORM", "Protocol: Consumable Registry", { onSaved });
        },
        openAddAssetCategory: ({onSaved}: any) => {
            openModal("ASSET_CAT_FORM", "Protocol: Asset Registry", { onSaved });
        },
        openInternalTransfer: () =>
            openModal(
                "INTERNAL_TRANSFER",
                "Execute Contra Transfer",
                {} // No initial data needed for fresh transfers
            ),

        // ✨ THE FIX IS HERE: Added 'defaultType' to the parameters and the payload
        // useUIModals.ts refinement
        openAccountHeadForm: ({ initialData, defaultType, onSaved }: {
            initialData?: any,
            defaultType?: string,
            onSaved?: () => void
        } = {}) =>
            openModal(
                "ACCOUNT_HEAD_FORM",
                !!initialData ? "Edit Account Head" : "New Account Head",
                { initialData, defaultType, onSaved } // ✨ Pass onSaved to the form
            ),
        // --- INVENTORY ---
        openManageStock: ({ item }: { item: any }) =>
            openModal(
                "MANAGE_STOCK",
                `Manage Stock: ${item?.name || 'Item'}`,
                { item }
            ),

        openInventoryItemForm: ({ item }: { item?: any } = {}) =>
            openModal(
                "INVENTORY_ITEM_FORM",
                !!item ? "Update Inventory Item" : "New Inventory Item",
                { item }
            ),

        closeModal: () => closeModal()
    };
}