import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Stracel</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              A decentralized marketplace built on Celo blockchain.
              Buy and sell goods securely with smart contracts and G$.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/marketplace" className="hover:text-black dark:hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="hover:text-black dark:hover:text-white transition-colors">
                  My Listings
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-black dark:hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-black dark:hover:text-white transition-colors">
                  Help & FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black dark:text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="https://celo.org" target="_blank" rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1">
                  Celo Blockchain <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://explorer.celo.org/mainnet" target="_blank" rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1">
                  Celo Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://github.com/Marvy247/StraCel" target="_blank" rel="noopener noreferrer"
                  className="hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1">
                  <Github className="h-3 w-3" /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Stracel. Built on Celo blockchain. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
// grid-cols-1 md:grid-cols-4
// text-center md:text-left
// py-8
