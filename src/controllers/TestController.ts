import { Request, Response } from 'express'
import { transactionalTemplate } from '../lib/emailTemplate'

export default class TestController {
	public static async testSchema(
		_req: Request,
		res: Response
	): Promise<Response> {
		const result = await services.validator.validate({
			data: { something: true, abridged: 'asdf' },
			schemaName: 'Book'
		})

		return res.json({
			status: 'success',
			isValid: result.valid,
			result
		})
	}

	public static async testWebhook(
		req: Request,
		res: Response
	): Promise<Response> {
		log.debug({
			body: req.body,
			query: req.query,
			params: req.params
		})

		return res.json({
			status: 'success'
		})
	}

	public static async testEmail(
		req: Request,
		res: Response
	): Promise<Response> {
		await services.aws.sendEmail({
			to: ['ken@meem.wtf'],
			body: '<h1>Testing email</h1>',
			subject: 'Testing email'
		})

		return res.json({
			status: 'success'
		})
	}

	public static async testEmailHtml(
		req: Request,
		res: Response
	): Promise<Response> {
		const html = transactionalTemplate({
			subject: 'Testing email',
			inboxPreview: "Here's an inbox preview of the message.",
			// title: 'Testing email',
			bodyText:
				'Ut <b>reprehenderit qui</b>. Animi numquam laborum est recusandae. Sequi iusto nisi assumenda vel est numquam aut. Eius adipisci voluptatem distinctio magnam sed nemo non quas eligendi. Facilis officia et et deleniti consequuntur vel.\n\nLibero magni rem vel. Quo est dignissimos ea ut enim et qui. Dignissimos ratione qui quisquam fuga quos ut delectus quia. Quia nihil a voluptatem ullam. Et veniam maiores consequatur vel et odit et repellat. Quasi accusamus quis.\n\n Quo eius rerum voluptatum doloremque qui nisi explicabo ipsam ipsa. Eum iste molestiae qui facilis velit nisi alias molestias sint. Voluptatem voluptatem rerum consequatur eum quidem perspiciatis. Voluptatum iure modi qui alias eius distinctio at.',
			ctaText: 'Click here to do something',
			ctaUrl: 'https://meem.wtf'
		})

		return res.send(html)
	}
}
