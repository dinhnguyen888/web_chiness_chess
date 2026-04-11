import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tooltip, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, HistoryOutlined, PlusOutlined, UserOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { httpApiUrl } from '../../config/server';
import { Link } from 'react-router-dom';
import UserHistoryModal from './UserHistoryModal';

const { Title } = Typography;

interface UserItem {
  id: number;
  username: string;
  role: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('chess_jwt_token');
      const res = await fetch(httpApiUrl('/admin/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        message.error('Không tải được danh sách người dùng');
      }
    } catch {
      message.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('chess_jwt_token');
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...values, id: editingUser.id } : values;

      const res = await fetch(httpApiUrl('/admin/users'), {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        message.success(editingUser ? 'Cập nhật thành công' : 'Tạo mới thành công');
        setIsModalVisible(false);
        fetchUsers();
      } else {
        const err = await res.json();
        message.error(err.error || 'Thao tác thất bại');
      }
    } catch {
      message.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa người dùng này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const token = localStorage.getItem('chess_jwt_token');
          const res = await fetch(httpApiUrl(`/admin/users?id=${id}`), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            message.success('Đã xóa người dùng');
            fetchUsers();
          } else {
            message.error('Không thể xóa');
          }
        } catch {
          message.error('Lỗi kết nối');
        }
      }
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Username', 
      dataIndex: 'username', 
      key: 'username',
      render: (text: string) => <span><UserOutlined style={{ marginRight: 8 }} />{text}</span>
    },
    { 
      title: 'Quyền hạn', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => (
        <span style={{ 
          color: role === 'admin' ? '#f5222d' : '#1890ff', 
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {role}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: UserItem) => (
        <Space size="middle">
          <Tooltip title="Lịch sử đấu">
            <Button 
              shape="circle" 
              icon={<HistoryOutlined />} 
              onClick={() => setHistoryTarget(record.username)} 
              type="primary"
              ghost
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              shape="circle" 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingUser(record);
                form.setFieldsValue({
                  username: record.username,
                  role: record.role,
                  password: ''
                });
                setIsModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              shape="circle" 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.id)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space align="center" size="large">
            <Link to="/">
              <Button icon={<ArrowLeftOutlined />} shape="circle" />
            </Link>
            <Title level={2} style={{ margin: 0 }}>Quản lý người dùng (Admin)</Title>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Thêm người dùng
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
          open={isModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={loading}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateOrUpdate}
            initialValues={{ role: 'user' }}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item
              name="password"
              label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
              rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="role"
              label="Quyền hạn"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="user">USER</Select.Option>
                <Select.Option value="admin">ADMIN</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {historyTarget && (
          <UserHistoryModal 
            username={historyTarget} 
            onClose={() => setHistoryTarget(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default UserManager;
