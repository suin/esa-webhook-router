import { createRouter } from './index'
import fs from 'fs'
import { parseRequest, ParseRequestResult } from 'http-string-parser'

const mockRequest = (name: string): ParseRequestResult => {
  const content = fs
    .readFileSync(__dirname + '/test/' + name + '.http')
    .toString()
  const request = parseRequest(content)
  request.headers = Object.keys(request.headers).reduce((c, k) => {
    return { ...c, [k.toLowerCase()]: request.headers[k] }
  }, {} as any)
  return request
}

describe('Router', () => {
  describe('post_create', () => {
    test('handle post_create event', end => {
      const { method: httpMethod, headers, body } = mockRequest('post_create')
      const router = createRouter()
      router.on('post_create', payload => {
        expect(payload).toEqual(JSON.parse(body))
        end()
      })
      router.route({ httpMethod, headers, body })
    })
    test('handle post_create event with signature', end => {
      const { method: httpMethod, headers, body } = mockRequest(
        'post_create_with_signature',
      )
      const router = createRouter({ secret: 'my_secret_key' })
      router.on('post_create', payload => {
        expect(payload).toEqual(JSON.parse(body))
        end()
      })
      router.route({ httpMethod, headers, body })
    })
    test('signature not match', () => {
      const { method: httpMethod, headers, body } = mockRequest(
        'post_create_with_signature',
      )
      const router = createRouter({ secret: 'other_secret_key' })
      expect(() => {
        router.route({ httpMethod, headers, body })
      }).toThrowError(`Signatures didn't match!`)
    })
  })

  describe('post_update', () => {
    test('handle post_update event', end => {
      const { method: httpMethod, headers, body } = mockRequest('post_update')
      const router = createRouter()
      router.on('post_update', payload => {
        expect(payload).toEqual(JSON.parse(body))
        end()
      })
      router.route({ httpMethod, headers, body })
    })
  })

  describe('post_archive', () => {
    test('handle post_archive event', end => {
      const { method: httpMethod, headers, body } = mockRequest('post_archive')
      const router = createRouter()
      router.on('post_archive', payload => {
        expect(payload).toEqual(JSON.parse(body))
        end()
      })
      router.route({ httpMethod, headers, body })
    })
  })

  describe('post_delete', () => {
    test('handle post_delete event', end => {
      const { method: httpMethod, headers, body } = mockRequest('post_delete')
      const router = createRouter()
      router.on('post_delete', payload => {
        expect(payload).toEqual(JSON.parse(body))
        end()
      })
      router.route({ httpMethod, headers, body })
    })
  })
})
