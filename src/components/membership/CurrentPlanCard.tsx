import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, Clock } from 'lucide-react';
import RazorpayMembershipButton from '@/components/ui/RazorpayMembershipButton';

interface CurrentPlanCardProps {
  membership: any;
  user: any;
  onRenewSuccess: () => void;
}

const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ membership, user, onRenewSuccess }) => {
  if (!membership) return null;

  const daysRemaining = membership?.end_date 
    ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
    : null;

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <Card className={`relative overflow-hidden ${
      isExpired 
        ? 'border-red-300 bg-red-50' 
        : isExpiringSoon 
        ? 'border-yellow-300 bg-yellow-50' 
        : 'border-green-300 bg-green-50'
    }`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isExpired 
          ? 'bg-red-500' 
          : isExpiringSoon 
          ? 'bg-yellow-500' 
          : 'bg-green-500'
      }`} />
      
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Crown className={`h-5 w-5 ${
            isExpired 
              ? 'text-red-500' 
              : isExpiringSoon 
              ? 'text-yellow-500' 
              : 'text-green-500'
          }`} />
          Current Plan
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{membership.plan?.name} Plan</h3>
            <p className="text-gray-600">₹{membership.amount_inr}</p>
          </div>
          <Badge 
            variant={isExpired ? "destructive" : isExpiringSoon ? "default" : "secondary"}
            className={
              isExpired 
                ? "bg-red-100 text-red-700 border-red-300" 
                : isExpiringSoon 
                ? "bg-yellow-100 text-yellow-700 border-yellow-300" 
                : "bg-green-100 text-green-700 border-green-300"
            }
          >
            {membership.status}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(membership.start_date).toLocaleDateString()} - {new Date(membership.end_date).toLocaleDateString()}
            </span>
          </div>
          
          {daysRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={
                isExpired 
                  ? 'text-red-600 font-medium' 
                  : isExpiringSoon 
                  ? 'text-yellow-600 font-medium' 
                  : 'text-green-600'
              }>
                {daysRemaining > 0 
                  ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining` 
                  : 'Expired'}
              </span>
            </div>
          )}
        </div>
        
        {/* Renew Button */}
        {user?.id && membership.plan && (
          <RazorpayMembershipButton
            planId={membership.plan.id}
            userId={user.id}
            planName={membership.plan.name}
            amount={membership.plan.price_inr}
            onSuccess={onRenewSuccess}
            className={`w-full font-medium ${
              isExpired || isExpiringSoon
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
            }`}
          >
            {isExpired ? 'Reactivate Plan' : 'Renew Plan'}
          </RazorpayMembershipButton>
        )}
        
        {isExpiringSoon && (
          <div className="text-center p-3 bg-yellow-100 rounded-lg border border-yellow-300">
            <p className="text-yellow-700 text-sm font-medium">
              ⚠️ Your plan expires soon! Renew now to continue enjoying premium features.
            </p>
          </div>
        )}
        
        {isExpired && (
          <div className="text-center p-3 bg-red-100 rounded-lg border border-red-300">
            <p className="text-red-700 text-sm font-medium">
              🚨 Your plan has expired. Reactivate to regain access to premium features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentPlanCard;