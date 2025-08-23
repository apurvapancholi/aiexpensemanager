import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Receipt,
  DollarSign,
  Target,
  Bot,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Receipts", href: "/receipts", icon: Receipt },
    { name: "Expenses", href: "/expenses", icon: DollarSign },
    { name: "Budget Goals", href: "/budget", icon: Target },
    { name: "AI Assistant", href: "/ai", icon: Bot },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email || "User";
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="button-mobile-menu"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800" data-testid="text-app-name">
              ExpenseTracker Pro
            </h1>
            <p className="text-sm text-gray-600 mt-1">Personal Finance Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6">
            <div className="px-6 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </p>
            </div>
            <ul className="mt-2">
              {navigation.slice(0, 4).map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a
                        className={`
                          flex items-center px-6 py-3 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "text-primary bg-blue-50 border-r-2 border-primary"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="px-6 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tools
              </p>
            </div>
            <ul className="mt-2">
              {navigation.slice(4).map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a
                        className={`
                          flex items-center px-6 py-3 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "text-primary bg-blue-50 border-r-2 border-primary"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate" data-testid="text-user-name">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-gray-500 truncate" data-testid="text-user-email">
                    {(user as any)?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-1"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0 ml-0">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {children}
      </div>
    </div>
  );
}
