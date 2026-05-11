import api from '../config/api';

export async function getMembershipPlans() {
  const res = await api.get('/memberships/plans');
  return res.data;
}

export async function getMyMembership() {
  const res = await api.get('/memberships/me');
  return res.data;
}
