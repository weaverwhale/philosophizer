interface DockerImage {
  tag: string;
  lastUpdated: string;
  size: number;
  sizeFormatted: string;
  architectures: string[];
  url: string;
}

interface DockerImagesProps {
  dockerImages: DockerImage[];
  dockerRepo: string;
}

export function DockerImages({ dockerImages, dockerRepo }: DockerImagesProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">
        Published Docker Images
      </h2>
      <div className="bg-surface border border-border rounded-lg p-4">
        {dockerRepo && (
          <div className="mb-4">
            <span className="text-sm text-text-muted">Repository: </span>
            <a
              href={dockerImages[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80"
            >
              {dockerRepo}
            </a>
          </div>
        )}

        {dockerImages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium">
                    Tag
                  </th>
                  <th className="text-left py-2 text-text-muted font-medium">
                    Size
                  </th>
                  <th className="text-left py-2 text-text-muted font-medium">
                    Architectures
                  </th>
                  <th className="text-left py-2 text-text-muted font-medium">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {dockerImages.map(image => (
                  <tr key={image.tag} className="border-b border-border">
                    <td className="py-2 text-text font-medium">{image.tag}</td>
                    <td className="py-2 text-text">{image.sizeFormatted}</td>
                    <td className="py-2 text-text text-xs">
                      {image.architectures.join(', ')}
                    </td>
                    <td className="py-2 text-text">
                      {new Date(image.lastUpdated).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-text-muted text-sm">
            No Docker images found. Configure DOCKER_HUB_USERNAME and
            DOCKER_HUB_REPO environment variables to view published images.
          </div>
        )}
      </div>
    </section>
  );
}

