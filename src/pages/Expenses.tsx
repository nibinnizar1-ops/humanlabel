import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Expense } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  Fabric: 'bg-blue-100 text-blue-800',
  Stitching: 'bg-purple-100 text-purple-800',
  Marketing: 'bg-orange-100 text-orange-800',
  Logistics: 'bg-green-100 text-green-800',
  Misc: 'bg-gray-100 text-gray-800',
};

export default function Expenses() {
  const { canEdit } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Group expenses by month
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const month = format(new Date(expense.expense_date), 'MMMM yyyy');
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  const totalThisMonth = expenses
    .filter(e => {
      const expenseMonth = new Date(e.expense_date).getMonth();
      const currentMonth = new Date().getMonth();
      return expenseMonth === currentMonth;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <AppLayout>
      <PageHeader 
        title="Expenses" 
        action={
          canEdit && (
            <Link to="/expenses/new">
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          )
        }
      />

      <div className="p-4 space-y-4">
        {/* Monthly Summary */}
        <div className="stat-card bg-warning/10 border-warning/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month's Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalThisMonth)}</p>
            </div>
            <Calendar className="h-8 w-8 text-warning" />
          </div>
        </div>

        {/* Expense List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">No expenses recorded yet</p>
            {canEdit && (
              <Link to="/expenses/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first expense
                </Button>
              </Link>
            )}
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([month, monthExpenses]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">{month}</h3>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0))}
                </span>
              </div>

              <div className="space-y-2">
                {monthExpenses.map((expense) => (
                  <div key={expense.id} className="stat-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={categoryColors[expense.category]}>
                            {expense.category}
                          </Badge>
                        </div>
                        {expense.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {expense.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-semibold text-lg">
                          {formatCurrency(expense.amount)}
                        </p>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Link to={`/expenses/${expense.id}/edit`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}