import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import apiService from '../services/api' // Your Axios wrapper or fetch calls

const CategoryCard = ({ category, onEdit, onDelete, onToggleExpand }) => {
  const { id, name, icon, color, transactionCount, subcategories = [], expanded } = category
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{name}</h3>
            </div>
            {subcategories.length > 0 && (
              <div className="relative">
                <select 
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      // Handle subcategory selection if needed
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Subcategories ({subcategories.length})</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.transactionCount})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEdit(category)}
              className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁',
    color: '#3B82F6'
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        icon: category.icon || '📁',
        color: category.color || '#3B82F6'
      })
    } else {
      setFormData({ name: '', icon: '📁', color: '#3B82F6' })
    }
  }, [category, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  if (!isOpen) return null

  const iconOptions = ['📁', '🍔', '✈️', '🏠', '🛒', '🎬', '⚡', '🚗', '💊', '🎓']
  const colorOptions = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{category ? 'Edit Category' : 'New Category'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-3 text-xl border rounded-lg hover:bg-gray-50 ${formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-12 h-12 rounded-lg border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  // ✅ Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await apiService.getAllCategories() // GET /api/categories
      const dataWithExpanded = res.map(cat => ({ ...cat, expanded: false }))
      setCategories(dataWithExpanded)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleEdit = (category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await apiService.deleteCategory(categoryId) // DELETE /api/categories/:id
      setCategories(categories.filter(cat => cat.id !== categoryId))
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  const handleToggleExpand = (categoryId) => {
    setCategories(categories.map(cat => cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat))
  }

  const handleSave = async (formData) => {
    try {
      if (editingCategory) {
        // Update
        const updated = await apiService.updateCategory(editingCategory.id, formData)
        setCategories(categories.map(cat => cat.id === editingCategory.id ? { ...updated, expanded: false } : cat))
      } else {
        // Create
        const created = await apiService.createCategory(formData)
        setCategories([...categories, { ...created, expanded: false }])
      }
      setEditingCategory(null)
    } catch (err) {
      console.error('Failed to save category:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        onSave={handleSave}
      />
    </div>
  )
}
