import { ExternalLink } from 'lucide-react'
import Link from 'next/link'


const ExpandedClickLink = ({link} : {link: string}) => {
    return (
        <div className="relative inline-block translate-y-5px">
            <Link href={link} target="_blank" className="z-10">
                <ExternalLink size={20} />
            </Link>

            <div
                className="absolute inset-[-10px] bg-transparent cursor-pointer z-20"
            />
        </div>
  )
}

export default ExpandedClickLink
