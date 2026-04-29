import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from './useAppStore';
import { notificationReceived } from '@/store/slices/notificationsSlice';
import { messageReceived } from '@/store/slices/chatSlice';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5112';

export function useSignalR(onDashboardUpdate?: (payload: unknown) => void) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.session?.accessToken);
  const connectionsRef = useRef<{ notifications: HubConnection | null; chat: HubConnection | null }>({
    notifications: null,
    chat: null,
  });

  useEffect(() => {
    if (!token) {
      // Clean up if token is removed
      if (connectionsRef.current.notifications) {
        connectionsRef.current.notifications.stop().catch(console.error);
        connectionsRef.current.notifications = null;
      }
      if (connectionsRef.current.chat) {
        connectionsRef.current.chat.stop().catch(console.error);
        connectionsRef.current.chat = null;
      }
      return;
    }

    const createAndStartConnection = async (hubUrl: string, connectionName: 'notifications' | 'chat') => {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl(`${API_URL}${hubUrl}`, { accessTokenFactory: () => token })
          .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
          .configureLogging(LogLevel.Warning)
          .build();

        // Setup event handlers
        if (connectionName === 'notifications') {
          connection.on('notification.received', (payload) => {
            dispatch(notificationReceived(payload));
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
          });
          connection.on('application.submitted', (payload) => {
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
            window.dispatchEvent(new CustomEvent('applications.updated', { detail: payload }));
          });
          connection.on('internship.published', (payload) => {
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
            window.dispatchEvent(new CustomEvent('internships.updated', { detail: payload }));
          });
          connection.on('recruiter.request.submitted', (payload) => {
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
            window.dispatchEvent(new CustomEvent('recruiter.request.submitted', { detail: payload }));
          });
          connection.on('notification.marked_as_read', (payload) => {
            console.log('Notification marked as read:', payload);
          });
          connection.on('notifications.all_marked_as_read', (payload) => {
            console.log('All notifications marked as read:', payload);
          });
          connection.on('notification.connected', (payload) => {
            console.log('Connected to notifications hub:', payload);
          });
          connection.on('dashboard.updated', (payload) => {
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
            if ((payload as { scope?: string } | null | undefined)?.scope === 'internships') {
              window.dispatchEvent(new CustomEvent('internships.updated', { detail: payload }));
            }
            onDashboardUpdate?.(payload);
            window.dispatchEvent(new CustomEvent('dashboard.updated', { detail: payload }));
          });
        } else if (connectionName === 'chat') {
          connection.on('message.received', (payload) => {
            dispatch(messageReceived(payload));
            window.dispatchEvent(new CustomEvent('workspace.updated', { detail: payload }));
          });
          connection.on('message.sent', (payload) => {
            console.log('Message sent:', payload);
          });
          connection.on('message.marked_as_read', (payload) => {
            console.log('Message marked as read:', payload);
          });
        }

        // Connection event handlers
        connection.onreconnected((connectionId) => {
          console.log(`${connectionName} hub reconnected:`, connectionId);
        });

        connection.onreconnecting((error) => {
          console.warn(`${connectionName} hub reconnecting:`, error);
        });

        connection.onclose((error) => {
          console.warn(`${connectionName} hub closed:`, error);
        });

        connection.on('error', (error) => {
          console.error(`${connectionName} hub error:`, error);
        });

        await connection.start();
        console.log(`${connectionName} hub connected`);
        connectionsRef.current[connectionName] = connection;
      } catch (error) {
        console.error(`Failed to connect to ${connectionName} hub:`, error);
        connectionsRef.current[connectionName] = null;
      }
    };

    // Create connections
    createAndStartConnection('/hubs/notifications', 'notifications');
    createAndStartConnection('/hubs/chat', 'chat');

    // Cleanup function
    return () => {
      const stopConnection = async (connection: HubConnection | null, name: string) => {
        if (connection?.state === 'Connected') {
          try {
            await connection.stop();
            console.log(`${name} hub stopped`);
          } catch (error) {
            console.error(`Error stopping ${name} hub:`, error);
          }
        }
      };

      stopConnection(connectionsRef.current.notifications, 'notifications');
      stopConnection(connectionsRef.current.chat, 'chat');
    };
  }, [dispatch, token, onDashboardUpdate]);
}
