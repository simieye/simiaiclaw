/**
 * ManyChat API 服务
 * 文档: https://api.manychat.com/
 * 认证: Bearer Token (Authorization: Bearer {MANYCHAT_API_KEY})
 * 格式: account_id:token (例如: 7902642:c3159ee7c046568e0c2d7590a088a127)
 */

const MANYCHAT_BASE_URL = 'https://api.manychat.com';

/** 获取 ManyChat API 认证头 */
function getAuthHeaders(): HeadersInit {
  const apiKey = import.meta.env.VITE_MANCHAT_API_KEY || '';
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/** 通用 POST 请求 */
async function mcPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<MCResponse<T>> {
  const res = await fetch(`${MANYCHAT_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json() as Promise<MCResponse<T>>;
}

// ============ API 类型 ============

export interface MCResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
}

export interface MCTag {
  id: number;
  name: string;
  tag_id?: number;
}

export interface MCCustomField {
  id: number;
  name: string;
  field_name: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean';
}

export interface MCSubscriber {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  profile_pic?: string;
  locale?: string;
  timezone?: string;
}

// ============ API 方法 ============

/** 获取所有标签 */
export async function getTags(): Promise<MCResponse<MCTag[]>> {
  return mcPost<MCTag[]>('/fb/page/getTags', {});
}

/** 获取所有自定义用户字段 */
export async function getCustomFields(): Promise<MCResponse<MCCustomField[]>> {
  return mcPost<MCCustomField[]>('/fb/page/getCustomFields', {});
}

/** 发送 Flow 流程给用户 */
export async function sendFlow(subscriberId: number, flowNs: string): Promise<MCResponse> {
  return mcPost('/fb/sending/sendFlow', {
    subscriber_id: subscriberId,
    flow_ns: flowNs,
  });
}

/** 发送内容给用户 */
export async function sendContent(
  subscriberId: number,
  contentId: number,
  data?: Record<string, unknown>
): Promise<MCResponse> {
  return mcPost('/fb/sending/sendContent', {
    subscriber_id: subscriberId,
    content_id: contentId,
    ...data,
  });
}

/** 给用户添加标签 */
export async function addTag(subscriberId: number, tagId: number): Promise<MCResponse> {
  return mcPost('/fb/subscriber/addTag', {
    subscriber_id: subscriberId,
    tag_id: tagId,
  });
}

/** 移除用户标签 */
export async function removeTag(subscriberId: number, tagId: number): Promise<MCResponse> {
  return mcPost('/fb/subscriber/removeTag', {
    subscriber_id: subscriberId,
    tag_id: tagId,
  });
}

/** 设置用户自定义字段 */
export async function setCustomField(
  subscriberId: number,
  customFieldId: number,
  value: string | number | boolean
): Promise<MCResponse> {
  return mcPost('/fb/subscriber/setCustomField', {
    subscriber_id: subscriberId,
    custom_field_id: customFieldId,
    value,
  });
}

/** 通过自定义字段查找用户（仅支持文本/数字类型，最多返回100条） */
export async function findByCustomField(
  fieldId: number,
  value: string | number
): Promise<MCResponse<MCSubscriber[]>> {
  return mcPost<MCSubscriber[]>('/fb/subscriber/findByCustomField', {
    field_id: fieldId,
    value,
  });
}

/** 发送文本消息给用户 */
export async function sendMessage(subscriberId: number, message: string): Promise<MCResponse> {
  return mcPost('/fb/sending/sendMessage', {
    subscriber_id: subscriberId,
    message: {
      type: 'text',
      text: message,
    },
  });
}
