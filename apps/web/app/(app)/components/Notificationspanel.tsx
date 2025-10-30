// // components/NotificationsPanel.tsx - Notifications dropdown

// 'use client';

// import { useStore } from '../lib/store';
// import { CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';

// export default function NotificationsPanel() {
//   const { notifications, markAsRead, markAllAsRead } = useStore();

//   const getIcon = (type: string) => {
//     switch (type) {
//       case 'success':
//         return <CheckCircle className="w-5 h-5 text-green-600" />;
//       case 'warning':
//         return <AlertTriangle className="w-5 h-5 text-orange-600" />;
//       case 'error':
//         return <XCircle className="w-5 h-5 text-red-600" />;
//       default:
//         return <Info className="w-5 h-5 text-blue-600" />;
//     }
//   };

//   const getBgColor = (type: string, read: boolean) => {
//     if (read) return 'bg-gray-50';
//     switch (type) {
//       case 'success':
//         return 'bg-green-50';
//       case 'warning':
//         return 'bg-orange-50';
//       case 'error':
//         return 'bg-red-50';
//       default:
//         return 'bg-blue-50';
//     }
//   };

//   return (
//     <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
//         <h3 className="font-semibold text-gray-900">Notifications</h3>
//         <button
//           onClick={markAllAsRead}
//           className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
//         >
//           <CheckCheck className="w-4 h-4" />
//           Mark all read
//         </button>
//       </div>

//       {/* Notifications List */}
//       <div className="max-h-96 overflow-y-auto">
//         {notifications.length === 0 ? (
//           <div className="px-4 py-12 text-center">
//             <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//             <p className="text-gray-600 text-sm">No notifications yet</p>
//           </div>
//         ) : (
//           notifications.map((notification) => (
//             <button
//               key={notification.id}
//               onClick={() => markAsRead(notification.id)}
//               className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
//                 !notification.read ? 'bg-blue-50/50' : ''
//               }`}
//             >
//               <div className="flex gap-3">
//                 <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-start justify-between gap-2 mb-1">
//                     <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
//                     {!notification.read && (
//                       <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
//                     )}
//                   </div>
//                   <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
//                   <p className="text-xs text-gray-500">
//                     {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
//                   </p>
//                 </div>
//               </div>
//             </button>
//           ))
//         )}
//       </div>

//       {/* Footer */}
//       {notifications.length > 0 && (
//         <div className="px-4 py-3 border-t border-gray-200 text-center">
//           <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
//             View all notifications
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }