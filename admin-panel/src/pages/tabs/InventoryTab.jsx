import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'
import InventoryManagement from '../../InventoryManagement'

export default function InventoryTab() {
  const { editingInventoryId, employees, handleDeleteInventory, handleEditInventory, handleInventoryChange, handleInventorySubmit, handleNewInventory, handleReviewRefillRequest, handleStockUpdate, inventory, inventoryFormData, inventoryMessage, loadingInventory, loadingRefillRequests, pendingRefillCount, refillRequests, setInventoryMessage, setStockUpdateModal, stockUpdateModal } = useAdminPanelContext()

  return (
      <InventoryManagement
        inventory={inventory}
        loadingInventory={loadingInventory}
        refillRequests={refillRequests}
        loadingRefillRequests={loadingRefillRequests}
        pendingRefillCount={pendingRefillCount}
        inventoryFormData={inventoryFormData}
        editingInventoryId={editingInventoryId}
        inventoryMessage={inventoryMessage}
        stockUpdateModal={stockUpdateModal}
        employees={employees}
        onInventoryFormChange={handleInventoryChange}
        onInventorySubmit={handleInventorySubmit}
        onNewInventory={handleNewInventory}
        onEditInventory={handleEditInventory}
        onDeleteInventory={handleDeleteInventory}
        onStockUpdate={handleStockUpdate}
        onStockModalChange={setStockUpdateModal}
        onReviewRefillRequest={handleReviewRefillRequest}
        onFormClose={() => setInventoryMessage({ type: '', text: '' })}
      />
  )
}
