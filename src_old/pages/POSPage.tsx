import React, { useState } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { useCartStore } from '../store/cartStore';
import type { Service } from '../types';

// Mock services data - replace with API call
const mockServices: Service[] = [
  {
    id: '1',
    name: 'Estacionamiento 1 Hora',
    description: 'Pago por 1 hora de estacionamiento',
    price: 2.50,
    currency: 'USD',
    category: 'parking',
    isActive: true,
  },
  {
    id: '2',
    name: 'Estacionamiento 2 Horas',
    description: 'Pago por 2 horas de estacionamiento',
    price: 4.50,
    currency: 'USD',
    category: 'parking',
    isActive: true,
  },
  {
    id: '3',
    name: 'Estacionamiento Día Completo',
    description: 'Pago por día completo de estacionamiento',
    price: 15.00,
    currency: 'USD',
    category: 'parking',
    isActive: true,
  },
  {
    id: '4',
    name: 'Lavado Express',
    description: 'Servicio de lavado rápido del vehículo',
    price: 10.00,
    currency: 'USD',
    category: 'service',
    isActive: true,
  },
  {
    id: '5',
    name: 'Lavado Premium',
    description: 'Lavado completo interior y exterior',
    price: 25.00,
    currency: 'USD',
    category: 'service',
    isActive: true,
  },
];

export const POSPage: React.FC = () => {
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [services] = useState<Service[]>(mockServices);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'parking', name: 'Estacionamiento' },
    { id: 'service', name: 'Servicios' },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory && service.isActive;
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleCheckout = () => {
    // TODO: Implement checkout flow
    alert('Procesando pago...');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Punto de Venta</h1>
        <p className="mt-2 text-gray-600">
          Selecciona los servicios que deseas adquirir
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and filters */}
          <Card>
            <div className="space-y-4">
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const cartItem = cart.items.find((item) => item.service.id === service.id);
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <Badge variant="info">{service.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(service.price, service.currency)}
                      </span>
                      {cartItem ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(service.id, cartItem.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(service.id, cartItem.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addItem(service)}
                          leftIcon={<Plus className="w-4 h-4" />}
                          size="sm"
                        >
                          Agregar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron servicios</p>
              </div>
            </Card>
          )}
        </div>

        {/* Cart sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card title="Carrito de Compra" className="space-y-4">
              {cart.items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.items.map((item) => (
                      <div
                        key={item.service.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 mr-4">
                          <p className="font-medium text-gray-900 text-sm">{item.service.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.service.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </span>
                          <button
                            onClick={() => removeItem(item.service.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(cart.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (16%)</span>
                      <span className="font-medium">{formatCurrency(cart.total * 0.16)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {formatCurrency(cart.total * 1.16)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleCheckout}
                      leftIcon={<CreditCard className="w-5 h-5" />}
                    >
                      Procesar Pago
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={clearCart}
                    >
                      Limpiar Carrito
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
