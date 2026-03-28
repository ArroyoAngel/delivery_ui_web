'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

export function useOrdersSocket() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });

    socket.on('order:updated', () => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['admin-orders'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [qc]);
}
