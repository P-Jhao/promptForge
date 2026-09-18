/**
 * Mock 配置
 *
 * 请求协议仍保留全局 Mock 字段，供服务端夹具和诊断使用；工作台不再把它作为用户可见的模式选择。
 */
export interface MockConfig {
  global: boolean;
}
