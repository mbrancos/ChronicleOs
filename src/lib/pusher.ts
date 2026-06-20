import Pusher from "pusher";

// Inicialização lazy: a instância do Pusher só é criada quando pusherServer é usado
// (em runtime), e não durante a fase de coleta de dados estáticos do Next.js (build time).
type PusherInstance = InstanceType<typeof Pusher>;

let _pusherServer: PusherInstance | undefined;

function getPusherServer(): PusherInstance {
  if (_pusherServer) return _pusherServer;
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.NEXT_PUBLIC_PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    throw new Error("Credenciais do Pusher ausentes no arquivo .env");
  }
  _pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });
  return _pusherServer;
}

export const pusherServer = new Proxy({} as PusherInstance, {
  get(_target, prop, receiver) {
    return Reflect.get(getPusherServer(), prop, receiver);
  },
});
