import { isObject } from '@suin/is-object'
import { TypedEventEmitter } from '@suin/typed-event-emitter'
import { APIGatewayProxyEvent } from 'aws-lambda'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { IncomingMessage } from 'http'
import getRawBody from 'raw-body'

export const createRouter = (params?: { readonly secret?: string }): Router =>
  new Router(params)

export type { Router }

class Router {
  private readonly secret?: string | undefined
  private readonly events = new EventEmitter() as TypedEventEmitter<{
    [kindPostCreate]: PostCreateHandler
    [kindPostUpdate]: PostUpdateHandler
    [kindPostArchive]: PostArchiveHandler
    [kindPostDelete]: PostDeleteHandler
  }>

  constructor({ secret }: { readonly secret?: string } = {}) {
    this.secret = secret
  }

  on(kind: KindPostCreate, handler: PostCreateHandler): this
  on(kind: KindPostUpdate, handler: PostUpdateHandler): this
  on(kind: KindPostArchive, handler: PostArchiveHandler): this
  on(kind: KindPostDelete, handler: PostDeleteHandler): this
  on(kind: Kind, handler: Handler): this {
    this.events.on(kind, handler)
    return this
  }

  async route(request: Request): Promise<void> {
    const req = await normalizeRequest(request)
    if (req.httpMethod !== 'POST') {
      throw new Error(`HTTP method must be POST, but it was ${req.httpMethod}`)
    }
    if (typeof req.body !== 'string') {
      throw new Error('HTTP body must be provided')
    }
    if (typeof req.signature === 'string' && typeof this.secret === 'string') {
      const calculatedSignature =
        'sha256=' +
        crypto.createHmac('sha256', this.secret).update(req.body).digest('hex')
      if (req.signature !== calculatedSignature) {
        throw new Error(
          `Signatures didn't match! given: ${req.signature}, calculated: ${calculatedSignature}`,
        )
      }
    }
    let payload: unknown
    try {
      payload = JSON.parse(req.body)
    } catch (e) {
      throw new Error(`Malformed JSON body: ${e.message}`)
    }
    const errors: string[] = []
    if (!isPayload(payload, errors)) {
      throw new Error(errors.join(' '))
    }
    this.emit(payload)
  }

  private emit(payload: Payload): void {
    switch (payload.kind) {
      case kindPostCreate:
        this.events.emit(payload.kind, payload)
        break
      case kindPostUpdate:
        this.events.emit(payload.kind, payload)
        break
      case kindPostArchive:
        this.events.emit(payload.kind, payload)
        break
      case kindPostDelete:
        this.events.emit(payload.kind, payload)
        break
    }
  }
}

type Request = IncomingMessage | AwsLambdaEventLike

const kindPostCreate = 'post_create'
type KindPostCreate = typeof kindPostCreate
export type PostCreateHandler = (payload: PostCreate) => void

export interface PostCreate {
  readonly kind: KindPostCreate
  readonly team: Team
  readonly post: Post
  readonly user: User
}

const kindPostUpdate = 'post_update'
type KindPostUpdate = typeof kindPostUpdate
export type PostUpdateHandler = (payload: PostUpdate) => void

export interface PostUpdate {
  readonly kind: KindPostUpdate
  readonly team: Team
  readonly post: PostWithDiff
  readonly user: User
}

const kindPostArchive = 'post_archive'
type KindPostArchive = typeof kindPostArchive
export type PostArchiveHandler = (payload: PostArchive) => void

export interface PostArchive {
  readonly kind: KindPostArchive
  readonly team: Team
  readonly post: Post
  readonly user: User
}

const kindPostDelete = 'post_delete'
type KindPostDelete = typeof kindPostDelete
export type PostDeleteHandler = (payload: PostDelete) => void

export interface PostDelete {
  readonly kind: KindPostDelete
  readonly team: Team
  readonly post: DeletedPost
  readonly user: User
}

export interface Team {
  readonly name: string
}

export interface Post {
  readonly name: string
  readonly body_md: string
  readonly body_html: string
  readonly message: string
  readonly wip: boolean
  readonly number: number
  readonly url: string
}

export interface User {
  readonly icon: Icon
  readonly name: string
  readonly screen_name: string
}

export interface Icon {
  readonly url: string
  readonly thumb_s: Thumb
  readonly thumb_ms: Thumb
  readonly thumb_m: Thumb
  readonly thumb_l: Thumb
}

export interface Thumb {
  readonly url: string
}

export interface PostWithDiff extends Post {
  readonly diff_url: string
}

export interface DeletedPost {
  readonly name: string
  readonly wip: boolean
  readonly number: number
}

type Kind = KindPostCreate | KindPostUpdate | KindPostArchive | KindPostDelete
const kinds = new Set<Kind>([
  kindPostCreate,
  kindPostUpdate,
  kindPostArchive,
  kindPostDelete,
])

type Handler =
  | PostCreateHandler
  | PostUpdateHandler
  | PostArchiveHandler
  | PostDeleteHandler

type Payload = PostCreate | PostUpdate | PostArchive | PostDelete
const isPayload = (
  payload: unknown,
  errors: string[] = [],
): payload is Payload => {
  if (!isObject<Payload>(payload)) {
    errors.push('The payload is not an type object.')
    return false
  }
  if (!kinds.has(payload.kind as Kind)) {
    errors.push(
      `The \`kind\` value ${JSON.stringify(payload.kind)} is not supported.`,
    )
    return false
  }
  return true
}

type AwsLambdaEventLike = Pick<
  APIGatewayProxyEvent,
  'httpMethod' | 'headers' | 'body'
>

const isAwsLambdaEventLike = (value: unknown): value is AwsLambdaEventLike =>
  isObject<AwsLambdaEventLike>(value) &&
  typeof value.httpMethod === 'string' &&
  isObject<AwsLambdaEventLike['headers']>(value.headers) &&
  (value.body === null || typeof value.body === 'string')

const convertAwaLambdaEventToNormalizeRequest = (
  request: AwsLambdaEventLike,
): NormalizedRequest => {
  return {
    httpMethod: request.httpMethod,
    signature: pickSignatureFromHeader(request.headers),
    body: request.body ?? undefined,
  }
}

const convertIncomingMessageToNormalizedRequest = async (
  request: IncomingMessage,
): Promise<NormalizedRequest> => {
  return {
    httpMethod: request.method,
    body: (await getRawBody(request)).toString(),
    signature: pickSignatureFromHeader(request.headers),
  }
}

const normalizeRequest = async (
  request: Request,
): Promise<NormalizedRequest> => {
  if (isAwsLambdaEventLike(request)) {
    return convertAwaLambdaEventToNormalizeRequest(request)
  }
  return convertIncomingMessageToNormalizedRequest(request)
}

type NormalizedRequest = {
  readonly httpMethod?: string | undefined
  readonly signature?: string | undefined
  readonly body?: string | undefined
}

const pickSignatureFromHeader = (
  headers: Record<string, unknown>,
): string | undefined => {
  const signature = headers['x-esa-signature']
  if (signature === undefined) {
    return undefined
  }

  if (typeof signature !== 'string') {
    throw new Error(
      `X-Esa-Signature header must be string or undefined: ${JSON.stringify(
        headers,
      )}`,
    )
  }
  return signature
}
