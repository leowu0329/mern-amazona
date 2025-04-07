import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        orders: action.payload,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true, successDelete: false };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false };
    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      return state;
  }
};
export default function OrderListScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, orders, loadingDelete, successDelete }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: '',
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/orders`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(err),
        });
      }
    };
    if (successDelete) {
      dispatch({ type: 'DELETE_RESET' });
    } else {
      fetchData();
    }
  }, [userInfo, successDelete]);

  const deleteHandler = async (order) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        dispatch({ type: 'DELETE_REQUEST' });
        await axios.delete(`/api/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('order deleted successfully');
        dispatch({ type: 'DELETE_SUCCESS' });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: 'DELETE_FAIL',
        });
      }
    }
  };

  const updatePaymentStatus = async (order) => {
    if (window.confirm('確定要更新付款狀態嗎？')) {
      try {
        await axios.put(
          `/api/orders/${order._id}/pay`,
          {},
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          },
        );
        toast.success('付款狀態已更新');
        // Refresh the orders list
        dispatch({ type: 'DELETE_RESET' });
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  const updateDeliveryStatus = async (order) => {
    if (window.confirm('確定要更新配送狀態嗎？')) {
      try {
        await axios.put(
          `/api/orders/${order._id}/deliver`,
          {},
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          },
        );
        toast.success('配送狀態已更新');
        // Refresh the orders list
        dispatch({ type: 'DELETE_RESET' });
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  return (
    <div>
      <Helmet>
        <title>訂單列表</title>
      </Helmet>
      <h1>訂單列表</h1>
      {loadingDelete && <LoadingBox></LoadingBox>}
      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>客戶</th>
              <th>日期</th>
              <th>總金額</th>
              <th>付款方式</th>
              <th>付款狀態</th>
              <th>配送狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.user ? order.user.name : '已刪除用戶'}</td>
                <td>{order.createdAt.substring(0, 10)}</td>
                <td>{order.totalPrice.toFixed(2)}</td>
                <td>{order.paymentMethod}</td>
                <td>
                  {order.paymentMethod === 'CashOnDelivery' ? (
                    order.isDelivered ? (
                      order.isPaid ? (
                        '已付款'
                      ) : (
                        <Button
                          type="button"
                          variant="outline-success"
                          size="sm"
                          onClick={() => updatePaymentStatus(order)}
                        >
                          標記為已付款
                        </Button>
                      )
                    ) : (
                      '待送達'
                    )
                  ) : order.isPaid ? (
                    '已付款'
                  ) : (
                    <Button
                      type="button"
                      variant="outline-success"
                      size="sm"
                      onClick={() => updatePaymentStatus(order)}
                    >
                      標記為已付款
                    </Button>
                  )}
                </td>
                <td>
                  {order.isDelivered ? (
                    `已送達 ${order.deliveredAt.substring(0, 10)}`
                  ) : (
                    <Button
                      type="button"
                      variant="outline-primary"
                      size="sm"
                      onClick={() => updateDeliveryStatus(order)}
                    >
                      標記為已送達
                    </Button>
                  )}
                </td>
                <td>
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => {
                      navigate(`/order/${order._id}`);
                    }}
                  >
                    詳細
                  </Button>
                  &nbsp;
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => deleteHandler(order)}
                  >
                    刪除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
