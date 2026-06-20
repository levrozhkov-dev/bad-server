import { unlink } from 'fs'
import mongoose, { Document } from 'mongoose'
import { isAbsolute, relative, resolve } from 'path'

export interface IFile {
    fileName: string
    originalName: string
}

export interface IProduct extends Document {
    title: string
    image: IFile
    category: string
    description: string
    price: number
}

const cardsSchema = new mongoose.Schema<IProduct>(
    {
        title: {
            type: String,
            unique: true,
            required: [true, 'Поле "title" должно быть заполнено'],
            minlength: [2, 'Минимальная длина поля "title" - 2'],
            maxlength: [30, 'Максимальная длина поля "title" - 30'],
        },
        image: {
            fileName: {
                type: String,
                required: [true, 'Поле "image.fileName" должно быть заполнено'],
            },
            originalName: String,
        },
        category: {
            type: String,
            required: [true, 'Поле "category" должно быть заполнено'],
        },
        description: {
            type: String,
        },
        price: {
            type: Number,
            default: null,
        },
    },
    { versionKey: false }
)

cardsSchema.index({ title: 'text' })

const publicDir = resolve(__dirname, '../public')

function getPublicFilePath(imagePath: string) {
    const filePath = resolve(publicDir, imagePath.replace(/^[/\\]+/, ''))
    const relativePath = relative(publicDir, filePath)

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        return null
    }

    return filePath
}

function unlinkProductImage(imagePath: string) {
    const filePath = getPublicFilePath(imagePath)

    if (!filePath) {
        return
    }

    unlink(filePath, (err) => console.log(err))
}

// Можно лучше: удалять старое изображением перед обновлением сущности
cardsSchema.pre('findOneAndUpdate', async function deleteOldImage() {
    // @ts-ignore
    const updateImage = this.getUpdate().$set?.image
    const docToUpdate = await this.model.findOne(this.getQuery())
    if (updateImage && docToUpdate) {
        unlinkProductImage(docToUpdate.image.fileName)
    }
})

// Можно лучше: удалять файл с изображением после удаление сущности
cardsSchema.post('findOneAndDelete', async (doc: IProduct) => {
    unlinkProductImage(doc.image.fileName)
})

export default mongoose.model<IProduct>('product', cardsSchema)
