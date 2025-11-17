'use client'

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';

export default function POSPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Punto de Venta</h1>
          <p className="mt-2 text-white/70">
            Selecciona los servicios que deseas adquirir
          </p>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="w-24 h-24 text-white/30 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Punto de Venta
            </h3>
            <p className="text-white/60 text-center max-w-md">
              El punto de venta está en construcción. Próximamente podrás gestionar tus servicios y realizar cobros aquí.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
