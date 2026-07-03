import { Switch, Route, Redirect } from "wouter";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import Dashboard from "./admin/Dashboard";
import Inventory from "./admin/Inventory";
import Cms from "./admin/Cms";
import Users from "./admin/Users";
import { useAuth } from "@/lib/auth";

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  
  if (!user || user.role !== 'admin') {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/users" component={Users} />
          <Route path="/cms" component={Cms} />
        </Switch>
      </main>
    </div>
  );
}